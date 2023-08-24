# vue源码解析之 runtime-dom

## vue3.0+ 每个模块都能单独使用
```vue
let ｛ createApp， h ｝ = VueRuntimeDom

let App = {
    render(){
        return h('div',{style:{color:'red'},'test text'})
    }
}

<!-- 参数 1）组件以那个组件为入口 -->
createApp()
```
