// 核心 提供 DOM Api, 如：操作节点、操作属性的更新
import { extend } from "@vue/shared";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProps";
import { createRenderer } from "@vue/runtime-core";
export * from '@vue/runtime-core'
export * from '@vue/reactivity'

// 节点操作： 增删改查

// 属性操作： 添加 删除 更新 (样式、类、事件、其他属性)

// 渲染时用到的所有方法
export const rendererOptions =  extend({patchProp}, nodeOps)




// vue 中 runtime-core提供了核心的方法，用来处理渲染， 他会使用runtime-dom 中的 api 进行渲染


// 用户调用的时runtime-dom --.> runtime-core
// runtime-dom 是为了解决平台差异

export function createApp(rootComponent, rootProps=null){

    const app = createRenderer(rendererOptions).createApp(rootComponent, rootProps)
    let {mount} = app
    app.mount = function (container){
        // 清空容器的操作
        container = nodeOps.querySelect(container)
        container.innerHTML = ''
        // 将组件 渲染成 dom 元素，进行挂载
        mount(container)
    }
    return app
}