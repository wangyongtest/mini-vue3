# 核心源码系列 之 Reactivity 源码
`在上一节中，我们把环境搭建完成，接下来欧文们看下vue3.0+的响应式，如何收集依赖，如何更新`

## 如何在当前包依赖其他包
   执行 yarn workspace @vue/reactivity add @vue/shared@1.0.0,就会把包安装到reactivity的package.json中(发包时操作)


## 源码实现
 由于入口文件不实现功能，只做导出
### 创建 reactive.ts，并创建 reactive、shallowReactive、shallowReadonly、readonly四个函数并导出
- 创建完函数后，考虑，这四个方法的异同点。都是做拦截，只是拦截方式不同(考虑柯里化实现)
- 创建 createReactiveObject(target,isReadonly,baseHandlers) 创建一个公共方法，供上边四个API使用，传参不同， target:目标对象 isReadonly:是否只读  baseHandlers:拦截方法（对应
  四个API，分别为： reactiveHandlers, shallowReactiveHandlers, readonlyHandlers,shallowReadonlyHandlers）
- 在实现 createReactiveObject 时，首先要判断是不是对象，同时，要判断这个对象是不是深度代理对象，或者被只读代理了，所以需要创建两个 weakMap来存储 只读(readonlyMap)和代理(reactiveMap)  因为此API仅代理对象，最终返回这个对象
- 接下来实现 baseHandlers, 由于baseHandlers 是实现如何创建代理对象，与响应式无关，所以从reactive文件下拆出，在src目录下新建 baseHandlers.ts, 吧方法拷入，在reactive.ts中引入
- 实现 baseHandlers中的方法

### 测试
- 在根目录下创建 example目录，然后新建 reactivity.html 引入文件，
- 引入完运行 yarn run dev ,声称打包文件
- 引入对应API进行测试
- 最后注意下，如果要调试自己的源代码，tsconfig.json中的 sourcemap: true
![debugger测试我们代码](./images/%E6%B5%8B%E8%AF%95Api01.jpg)
![浏览器测试断点](./images/%E6%B5%8F%E8%A7%88%E5%99%A8%E8%BE%93%E5%87%BA%E6%96%AD%E7%82%B9.jpg)

## 测试完，API的输出与源吗输出无异，恭喜你，了解了响应式

![响应式实现概览](./images/reactivity%E6%80%9D%E8%B7%AF.png)


