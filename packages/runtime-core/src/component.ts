//  组件中的所有方法

import { ShapeFlags } from "packages/shared/src/shapeFlag"
import { PublicInstanceProxyHandlers } from "./componentPublicInstanceProxyHandlers"
import { isFunction, isObject } from "@vue/shared"

export function createComponentInstance(vnode){

    // webcomponent 组件需要有 属性  插槽 
    const instance = { // 组件的实例
        vnode,
        type: vnode.type,
        props:{}, // props attrs 区别： 
        attrs:{},
        slots:{},
        ctx: null,
        data:{},
        setupState:{}, // 如果setup 返回一个对象， 这个对象会作为 setUpstate
        isMounted: false, // 当前组件是否挂载过
        render: null
    }

    instance.ctx = {_: instance} // instance.ctx._
    return instance
}

export function setupComponent(instance){
    const {props, children} = instance.vnode

    // 根据props 解析出props 和attrs, 将其放到instance
    instance.props = props
    instance.children = children

    // 需要先看下当前组建是不是有状态的组件， 函数组件
    let isStateFul = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
    if(isStateFul){ // 表示当前是一个带状态的组件
        // 调用当前实例 setup 方法，用setup 返回值填充 setupState 和对应的render 方法
        setupStateFulComponent(instance)
    }
}


export let currentInstance = null
export let setCurrentInstance = (instance) => {
    currentInstance = instance
}
export let getCurrentInstance = () => {
    // 在setup中， 获取当前实例
    return currentInstance
}


function setupStateFulComponent(instance){
    // 1、代理 传递给render函数的参数
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any)

    //  2、获取组建的类型， 拿到组建的 setup方法

    let Component =  instance.type
    let { setup } = Component

    // ----------------------
    if(setup){
        currentInstance = instance
        let setContext = createSetupContext(instance)
      const setupResult = setup(instance.props, setContext) // instance 中的 props attrs slots emit expose 提取出来

      currentInstance = null
      handlerSetupResult(instance, setupResult)

    }else{
        finishComponentSetup(instance) // 完成组建的启动
    }
}

function handlerSetupResult(instance,setupResult){

    if(isFunction(setupResult)){
        instance.render = setupResult
    }else if(isObject(setupResult)){
        instance.setupState = setupResult
    }
    finishComponentSetup(instance)
}

function finishComponentSetup(instance){
    let Component =  instance.type
    
    if(!instance.render){
        //  对template 模版进行编译， 产生render函数
        if(!Component.render && Component.template){
            // 编译 将结果 赋 给Component.render
        }
        instance.render = Component.render // 需要将生成的render函数挂在实力上
    }
    console.log(instance);
    // console.log(instance.render.toString());
    
    // 对vue2.0+ 做了兼容处理
    // applyOptions

}


function createSetupContext(instance){
    return {
        attrs: instance.attrs,
        slots: instance.slots,
        emit:()=>{},
        expose:()=>{}
    }
}

//  instance 表示组件的状态，各种状态， 组件的相关信息
// context 就四个参数， ，为了开发时使用
// render函数参数  proxy 主要是为了取值方便 ==> instance.proxy