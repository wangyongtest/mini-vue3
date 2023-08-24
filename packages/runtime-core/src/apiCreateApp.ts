import { createVNode } from "./vNode"

// 
export function createAppApi(render){
  return  function createApp(rootComponent, rootProps){ // 告诉他那个组件那个属性来创建的应用
    const app = {
        _props: rootProps,
        _rootComponent:rootComponent,
        _container: null,
        mount(container){
            // let vNode = {} 
            // console.log(container,rootComponent,rootProps);
            // render(vNode, container)

            // 1、根据组件创建虚拟节点
            // 2、将虚拟几点和容器获取到后调用render方法进行渲染


            // 虚拟节点
           const vNode =  createVNode(rootComponent, rootProps)

           console.log(vNode,'vNode');
           render(vNode,container)
            // 调用render
            app._container = container
        }
    }
    return app
}
}


