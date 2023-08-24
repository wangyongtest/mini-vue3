import { isObject,extend,isArray,isIntegerKey,hasOwn,hasChanged } from "@vue/shared";
import {readonly,reactive} from './reactive'
import {track,trigger} from './effect'
import {TrackOpTypes,triggerOrTypes} from './operators'


// 由于拦截方法不一样
// 实现 new Proxy(target, handler)
// 核心拦截
function createGetter(isReadonly = false, shallow = false) {
    return function get (target,key, receiver){
         // proxy + reflect
        //  补充：后续Object上的方法 会被转移到 Reflect, Reflect.getProptypeof（）
        //  之前 target[key]=value方式设置可能会失败，并不会报异常，也没有返回值标识
        // Reflect方法具备返回值
        //  Reflect 使用可以不使用 proxy
        const res = Reflect.get(target,key, receiver)
        if(!isReadonly){
            // 非只读，收集依赖，数据变化后更新对应视图
            console.log('执行effect是会取值，收集 effect')
            // 
            track(target, TrackOpTypes.GET,key)
        }


        // 浅层==》返回对象
        if(shallow){
            return res
        }
// 看返回时是不是对象，同时是不是readonly:reactive
// 如果是只是 readonly不是只读递归转为响应式
// vue2: 一上来就递归，vue3:当取值时会进行代理。vue3:代理模式为懒代理
        if(isObject(res)){
            return isReadonly ? readonly(res) : reactive(res)
        }

        return res
    }
}
// 核心设置
function createSetter(shallow = false) {
    return function set (target,key, value, receiver){
      const oldValue = target[key]

 //  1、新增 还是更新。 vue2无法监控更改索引， 无法监控数组长度
     let hasKey =  isArray(target)&&isIntegerKey(key) ? Number(key) < target.length : hasOwn(target,key)
        // proxy + reflect
        const res = Reflect.set(target,key,value, receiver)


        if(!hasKey){
          
          // 新增
          trigger(target, triggerOrTypes.ADD, key, value)
        }else if(hasChanged(value, oldValue)){
          
          // 修改
          trigger(target, triggerOrTypes.SET, key, value, oldValue)
        }
        console.log('setter');
       // 当数据更新时，通知对应属性的 effect重新执行
      //  场景区分
     



        return res
    }
}

const get = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

// 提取合并方法
const set = createSetter();
const shallowSetter = createSetter();

// 是不是只读：
// 1、只读： set 会报异常
// 2、是不是深度
export const mutableHandlers = {
  get,
  set,
};
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSetter,
};

let readonlyObj = {
  set: (target, key) => {
    set: (target, key) => {
      console.warn(`set on key ${key} field`);
    };
  },
};
export const readOnlyHandlers = extend(
  {
    get: readonlyGet,
  },
  readonlyObj
);

export const shallowReadonlyHandlers = extend(
  {
    get: shallowReadonlyGet,
  },
  readonlyObj
);
