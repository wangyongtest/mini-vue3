import { isObject } from "@vue/shared";
import {mutableHandlers,shallowReactiveHandlers,readOnlyHandlers,shallowReadonlyHandlers} from './baseHandlers'


export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers);
}

export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers);
}

// 只读的调set方法报错
export function readonly(target) {
  return createReactiveObject(target, true, readOnlyHandlers);
}

export function shallowReadonly(target) {
  return createReactiveObject(target, true, shallowReadonlyHandlers);
}

//  方法的区别 1、是否只读 2、是否深层响应 ==》柯里化
//  new Proxy() 最核心hi需要拦截数据的读取和数据的修改 ==》 拦截 get set
// 04、创建两个 weekMap（）,存储只读和响应式（优点：会自动垃圾回收）
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();

export function createReactiveObject(target, isReadonly, baseHandlers) {
  // 01、创建响应式对象，
  //  如果目标对象不是对象,就没法拦截了，因为 reactive API 只对对象进行拦截
  if (!isObject(target)) {
    return target;
  }

  //  05、 创建只读和响应的映射表
  const proxyMap = isReadonly ? readonlyMap : reactiveMap;

  //  07、如果已经被代理了，直接返回即可
  const existProxy = proxyMap.get(target);
  if (existProxy) {
    return existProxy;
  }

  //    02、创建代理
  // 考虑：如果对象已经被代理了，就不需要在做代理,直接返回对象，但是这里分两种情况
  //    1、可能为一个对象，被深度代理
  //    2、又被只读代理了
  const proxy = new Proxy(target, baseHandlers);
  //   06、 将代理的对象和相应的代理结果换存起来
  proxyMap.set(target, proxy);
  // 03、返回proxy
  return proxy;
}
