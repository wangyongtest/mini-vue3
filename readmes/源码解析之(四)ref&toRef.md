# vue3源码系列之 ref&toRef
## ref && shallowRef
- 这里是一个类，使用的时类的属性访问器 class RefImpl{}
- 这个类中有get  set 方法
  - 当访问get 时，调用 track 方法， 同时 返回 value
  - 当访问 set 时，会进行新旧值的互换，吧新值赋值给value, 吧旧值赋值为被替换的值，这样下次再赋值时进行一个对比
- 这里同时判断 ref传参是不是 浅层响应式，非浅层 调用reactive
注：判断是否浅层响应式 是 ref 与 shallowRef 区别

## toRef && toRefs
 - 首先 这里的类型 不在是 RefImpl  而是 ObjectRefImpl
 - 因此 这两个憾事返回的是自己单独的 class ObjectRefImpl{}
   - get 直接返回的目标对象的value
   - set 同样直接设置的目标对象的value
 - 与 toRef的区别是 toRefs 可以支持对象，原理通过循环转化为ref

