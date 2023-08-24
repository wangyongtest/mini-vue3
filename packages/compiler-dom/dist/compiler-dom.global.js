var VueCompilerDOM = (function (exports) {
    'use strict';

    /**5、**/
    // 是否解析完成. 解析完成的依据 ctx.source === ''
    const isEnd = (ctx) => {
        const source = ctx.source;
        // 当以 </ 开头，说明没有子元素，直接结束
        if (ctx.source.startsWith('</')) {
            return true;
        }
        return !source;
    };
    function getCursor(ctx) {
        const { line, column, offset } = ctx;
        return {
            line,
            column,
            offset
        };
    }
    function advancePositionWithMutation(content, s, endIndex) {
        // 如何更新行， 如何更新列
        let linesCount = 0;
        let linePos = -1;
        for (let i = 0; i < endIndex; i++) {
            if (s.charCodeAt(i) === 10) {
                linesCount++;
                linePos = i;
            }
        }
        // console.log(linesCount, 'linesCount');
        // 更新 行列信息
        content.offset += endIndex;
        content.line += linesCount;
        content.column = linePos === -1 ? content.column + endIndex : endIndex - linePos;
        // console.log(content);
    }
    function advanceBy(content, endIndex) {
        // 
        let s = content.source;
        // 计算出一个新的结束位置,根据内容和索引来修改上下文的信息
        advancePositionWithMutation(content, s, endIndex);
        content.source = s.slice(endIndex);
    }
    function parseTextData(content, endIndex) {
        // 这里就拿到了原文本
        const rowText = content.source.slice(0, endIndex);
        // 前进，解析完了之后，游标向前移动
        advanceBy(content, endIndex);
        return rowText;
    }
    function advanceSpace(ctx) {
        const match = /^[ \t\r\n/>]+/.exec(ctx.source);
        if (match) {
            advanceBy(ctx, match[0].length);
        }
    }
    function parseTag(ctx) {
        const start = getCursor(ctx);
        // 解析标签
        //  以 空格 \t \r \n / 开头
        const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(ctx.source);
        const tag = match[1];
        advanceBy(ctx, match[0].length);
        // 前进空格 <div >
        advanceSpace(ctx);
        // 查看标签是不是自闭合标签
        const isSelfClosing = ctx.source.startsWith('/>');
        advanceBy(ctx, isSelfClosing ? 2 : 1);
        console.log(tag, 'tag');
        return {
            type: 5,
            tag,
            isSelfClosing,
            loc: getSelection(ctx, start)
        };
    }
    /**分支解析**/
    function parseElement(ctx) {
        // 1、解析标签名
        let ele = parseTag(ctx);
        const children = parseChildren(ctx);
        // 2、解析完标签
        if (ctx.source.startsWith('</')) {
            parseTag(ctx);
        }
        ele.children = children;
        ele.loc = getSelection(ctx, ele.loc.start);
        return ele;
    }
    function parseInterpolation(ctx) {
        const start = getCursor(ctx);
        // 首先确定 结束位置
        const closeIndex = ctx.source.indexOf('}}', '{{');
        advanceBy(ctx, 2);
        const innerStart = getCursor(ctx);
        const innerEnd = getCursor(ctx);
        const rawContextLength = closeIndex - 2; // 拿到 ｛｛内容｝｝ 包含空格
        const preTrimContent = parseTextData(ctx, rawContextLength);
        const content = preTrimContent.trim();
        const startOffset = preTrimContent.indexOf(content);
        // startOffset 大于0 时说明有空格
        if (startOffset > 0) {
            // 
            advancePositionWithMutation(innerStart, preTrimContent, startOffset);
        }
        // 然后去更新 结束偏移量
        const endOffset = content.length + startOffset;
        advancePositionWithMutation(innerEnd, preTrimContent, endOffset);
        advanceBy(ctx, 2);
        // console.log(content);
        return {
            type: 5,
            content: {
                type: 4,
                isStatic: false,
                loc: getSelection(ctx, innerStart, innerEnd)
            },
            loc: getSelection(ctx, start)
        };
    }
    //获取信息对应的 开始 结束 内容
    function getSelection(content, start, end) {
        end = end || getCursor(content);
        return {
            start: start,
            end,
            source: content.originalSource.slice(start.offset, end.offset)
        };
    }
    function parseText(ctx) {
        // 01、
        const endTokens = ['<', '{{'];
        let endIndex = ctx.source.length;
        // 获取文本整个长度 hello{{xxx}} <div></div>
        ctx.source.length;
        for (let i = 0; i < endTokens.length; i++) {
            // indexOf 搜索指定子字符串，并返回其第一次出现的位置索引
            const index = ctx.source.indexOf(endTokens[i]);
            if (index > -1 && endIndex > index) {
                endIndex = index;
            }
        }
        // console.log(endIndex, 'endIndex', ctx.source)
        // 有了文本的结束位置，就可以更新行列信息
        const start = getCursor(ctx);
        const content = parseTextData(ctx, endIndex);
        // console.log(content.source, start);
        return {
            type: 2,
            content,
            loc: getSelection(ctx, start)
        };
    }
    /**4、***/
    const parseChildren = (ctx) => {
        // 
        const nodes = [];
        while (!isEnd(ctx)) {
            // 当前上下文中的内容
            const s = ctx.source;
            let node;
            if (s.startsWith('<')) { // 标签
                node = parseElement(ctx);
            }
            else if (s.startsWith('{{')) { // 插值语法(表达式)
                node = parseInterpolation(ctx);
            }
            else {
                // 其余全部为文本
                node = parseText(ctx);
            }
            nodes.push(node);
        }
        // console.log(nodes);
        return nodes;
    };
    /**3、**/
    const createParseContext = (temp) => {
        // 
        return {
            line: 1,
            column: 1,
            offset: 0,
            source: temp,
            originalSource: temp // 这个值是不会变的，记录传入的内容
        };
    };
    /** 2、**/
    const baseParse = (temp) => {
        // 标识节点信息 ：行 列 偏移量……
        // 每解析一段，就移除一部分
        const context = createParseContext(temp);
        // 这里解析时增加一个 根节点
        // return createRoot(temp, parseChildren(context))
        return parseChildren(context);
    };
    /**1、**/
    const baseCompiler = (temp) => {
        // 1、将模版解析为 render 函数
        const ast = baseParse(temp);
        return ast;
    };

    exports.baseCompiler = baseCompiler;
    exports.baseParse = baseParse;
    exports.createParseContext = createParseContext;
    exports.isEnd = isEnd;
    exports.parseChildren = parseChildren;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=compiler-dom.global.js.map
