
export const nodeOps = {
    // createElement , 不同平台创建元素不同
    createElement: tagName => document.createElement(tagName), // 元素增加
    remove: child=>{
        const parent = child.parentNode
        if(parent){
            parent.removeChild(child)
        }
    },
    /**
     * 
     * @param child 插入元素
     * @param parent  插入的父节点
     * @param anchor 插入的参照物
     */
    insert: (child, parent,anchor=null)=>{
        parent.insertBefore(child, anchor) // 如果参照物为空，则相当于 appendChild
    },
    querySelect: selector=> document.querySelector(selector),
    setElementText: (el,text)=> el.textContent = text,
    // 文本操作
    createText: (text) => document.createTextNode(text),
    setText: (node,text)=> node.nodeValue = text,
    nextSibling:(node)=>node.nextSibling

}