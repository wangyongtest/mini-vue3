# 编译过程
- 先将模版进行分析 程程对应的 ast树 ---> 对象来描述语法
- 做转化流程  transform --> 对动态节点做一些标记 指令 插槽 事件 属性 ……  patchFlag
- 代码生成 codegen ---> 生成最终代码


## block的概念 --> block tree
 - block作用就是收集动态节点(自己下边所有的)， 将树的递归拍平成一个数组
 - 在 createVnode 的时候，会判断这个接电视动态的，就让外层的block收集起来
 - 目的为了 diff 的时候 只 diff 只 diff动态节点


 ## patchFlag 对不同动员爱节点进行描述
  > 表示要比对那个类型



