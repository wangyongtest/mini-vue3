// createVNode 创建虚拟节点 

import { isArray, isObject, isString } from "@vue/shared"
import { ShapeFlags } from "packages/shared/src/shapeFlag"

export function isVnode(vNode){
    return vNode.__v_isVnode
}


export const createVNode = (type, props, children=null)=>{
    // 可以根据type 来区分组件 还是普通元素

    // 根据type 区分是元素还是组件
    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0

    // 给虚拟节点添加一个类型
    const vnode = {
        // 一个对象来描述对应内容，虚拟节点有跨平台能力
        __v_isVnode: true,
        type,
        props,
        children,
        component: null,
        el: null, // 稍后将虚拟节点和真实节点对应起来
        key: props&&props.key,  // diff算法会用到key
        shapeFlag // 判断出当前元素和子元素的类型
    }

    normalizeChildren(vnode,children, )



    return vnode
}

function normalizeChildren(vnode, children){

    let type = 0

    if(children == null){ // 不对子元素进行处理

    } else if(isArray(children)){
        type = ShapeFlags.ARRAY_CHILDREN

    }else {
        type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag |= type
}


export const Text = Symbol('Text')
export function normalizeVNode(child){
    if(isObject(child)) return child
    return createVNode(Text, null,String(child))
}