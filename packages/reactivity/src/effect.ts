import { isArray,isIntegerKey } from "@vue/shared";
import { triggerOrTypes } from "./operators";

// effect 接收两个参数， 第一为函数，第二个为配置项
export function effect(fn, options: any = {}) {
  // 目的：让effect变为响应式，数据变化进行重新执行
  const effect = createReactiveEffect(fn, options);

  // 如果属性中由lazy，说明是懒执行，首次不执行，柔则执行

  if (!options.lazy) {
    // 响应式默认会执行一次
    effect();
  }

  return effect;
}

// 给 effect 添加标识(全局标识)
let uid = 0;
let activeEffect; // 存储当前的effect
const effectStack = [];
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    // 解决场景二
    // 判断栈中是否存在 effect, 不存在则放入栈中【保证effect没有加入到effectStack中】
    if (!effectStack.includes(effect)) {
      // 这里的执行可能会出错，使用try
      try {
        // 入栈
        effectStack.push(effect);
        activeEffect = effect;
        // 函数的执行会取值，取值会触发 createGetter方法
        return fn();
      } finally {
        // 执行完了之后出栈
        effectStack.pop();
        // 吧activeEffect 设置为 最后一个 effect
        // 这样就能保证 track 中的key 与 activeEffect对应上
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  // 只做标识
  effect.id = uid++;
  // 用于标识这个effect是个响应式effect
  effect._isEffect = true;
  // 保留 effect对应的原函数，创建映射关系
  effect.raw = fn;
  // 保存用户属性
  effect.options = options;
  return effect;
}

// 收集依赖
// 能够拿到当前的 effect
// 让某个对象中的属性收集当他对应的effect函数
const targetMap = new WeakMap();
export function track(target, type, key) {
  activeEffect; // 当前正在运行的effect
  //   至此各个effect之间的对应关系已经对应上
  // console.log(target, type, activeEffect);
  //   接下来属性和effect关联
  if (activeEffect === undefined) {
    // 此属性不需要收集依赖，因为没在effect中使用
    return;
  }

  // 查看 weakMap 是否存在 target
  let depsMap = targetMap.get(target);
  // 不存在添加， key:Object value: Map
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  // 在map 对象上查找对应key,
  let dep = depsMap.get(key);
  // 不存在 设置 此map 对象 key ,value： Set
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  // 当前 ket 的value中是否存在 activeEffect,  不存在，添加进去
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
  }

  // console.log(targetMap, "targetMap");
}

// 触发更新
// 找属性对应的 effect 让其执行 （数组、 对象）
export function trigger(target, type, key?, newValue?, oldValue?) {
  //
  // console.log(target, type, key, newValue, oldValue);
  // 如果当前属性没有收集过 effect, 不需要作任何操作
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  // 将所有的要执行的effect 全部存到一个新的集合中，最后统一执行
//   这里对 effect进行额去重
  const effects = new Set();
  const add = (effectToAdd) => {
    if (effectToAdd) {
      effectToAdd.forEach((effect) => effects.add(effect));
    }
  };

  // 1、判断修改的是不是数组的长度，因为修改的是数组长度，影响较大
  if (key === "length" && isArray(target)) {
    // 如果对应的长度 有依赖是收集（注释：数组长度大于更新的长度）
    depsMap.forEach((dep, key) => {
      // console.log(dep, key);
      // 修改长度必收集的索引小
      if (key === "length" || key > newValue) {
        // 如果更改的长度 小鱼收集的索引，那么这个索引也需要触发 effect重新更新
        // dep 是个map对象
        add(dep);
      }
    });
  } else {
    // 可能是对象
    if(key !== undefined){ // 修改，不可能新增
        add(depsMap.get(key)) // 
    }
    // 如果修改数组中的某一个索引
    // 如果是添加了一个树荫就出发长度的更新
    switch(type){
        case triggerOrTypes.ADD:{
            if(isArray(target) && isIntegerKey(key)){
                add(depsMap.get('length'))
            }
        }
    }
  }
  effects.forEach((effect:any)=>{
    if(effect.options.scheduler){
      effect.options.scheduler(effect)
    }else{
      effect()
    }
  })
}

/**场景**/

// 第一步：使用一个map 对象， key:｛name:test,age:123｝ value： map对象，这个对象的 key:name value:set
// weakMap: key =》｛name:test,age:123｝  value：(map) => ｛name=> set｝
// {name: 'test', age: 123} => name => [effect,effect]
// 同时出现多个相同的effect
// effect(()=>{
//     state.name
// })
// effect(()=>{
//     state.name
// })

// 由于使用了一个全局变量activeEffect,会出现问题，这里模拟出现问题的场景
// 当出现函数嵌套时， 那么这个activeEffect就无法对应了
// 解决方案;effectStack栈
// 场景一 函数调用是一个栈结垢
// effect(()=>{         effect1
//     state.name       effect1
//     effect(（）=>{    effect1
//         state.age     effect2
//     })
//     state.addres     effect2
// })

// 当出现这中情况时，会出现死循环
// 场景二
// effect(() => {
//     state.num++
// })
