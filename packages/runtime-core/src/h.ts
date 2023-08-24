import { isArray, isObject } from "@vue/shared"
import { createVNode, isVnode } from "./vNode"

export function h(type, propsOrChildren, children){

    const l = arguments.length

    if(l == 2){ // 属性 + children   || 类型 + children
        //  如果 propsOrChildren 是数组， 直接作为第三个参数
        if(isObject(propsOrChildren) && !isArray(propsOrChildren)){
            if(isVnode(propsOrChildren)){ // 子元素节点， 只能是 字符串 || 数组
                return createVNode(type, null, [])
            }
            return createVNode(type, propsOrChildren)
            
        }else{
            // 如果第二个参数不是对象， 一定是 children
            return createVNode(type, null, propsOrChildren)
        }

    }else{
        if(l > 3){
            children = Array.prototype.slice.call(arguments, 2)
        }else if(l === 3 && isVnode(children)){
            children = [children]
        }
        return createVNode(type, propsOrChildren,children)
    }


}