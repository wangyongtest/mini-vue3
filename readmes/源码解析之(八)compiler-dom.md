# compiler-dom

## 配置
- 在packages/compiler-dom,
- `执行 yarn init -y` 生成package.json
- 添加 buildOptions, 执行 yarn install 生成软链
- 在 compiler-dom 下 创建 src & index.js
- 在根目录下 example 下创建 compilerDom.html
- 修改 scripts/dev ,仅打包 compiler-dom
- 执行 npm run dev 进行打包

## 解析流程
- 将模版解析为 render 函数
- 标识节点信息.每解析一完成一部分就移除(截取)一部分，直到所有内容解析完成
- [解析文本] 循环解析，以 < 开头 或者 以 {{ 开头的，计算出 行、列、偏移量
- ![Alt text](image.png) 最终返回结果
- [解析表达式] 新建一个 div 作为根节点，包裹下所有子元素， 然后 通过解析标签开始和结束，截取解析完的字符串，最终字符串被清空，解析结束


## 测试网站
- astexplorer.net
