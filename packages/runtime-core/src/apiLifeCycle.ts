import { currentInstance, setCurrentInstance,getCurrentInstance } from "./component";
export {getCurrentInstance} from './component'

const enum LifeCycleHooks {
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
  BEFORE_UPDATE = "bu",
  UPDATED = "u",
}

const injectHooks = (type, hook, target) => {
    // 在此函数中保留了实例(闭包)
  if (!target) {
    return console.warn(
      "injection APIs can only be used during execution of setup()"
    );
  }else{
   const hooks =  target[type] || (target[type] = []) // instance.bm = []

//    使用欺骗方法
const wrap = () => {
    setCurrentInstance(target) // currentInstance = 自己的
    hook.call(target)
    setCurrentInstance(null)
}
   hooks.push(wrap)
  }
};

const createHooks =
  (lifeCycle) =>
  (hook, target = currentInstance) => {
    // target 用来表示他是那个市里的钩子

    // 给当前的实例增加对应的生命周期
    injectHooks(lifeCycle, hook, target);
  };


  export const invokeArrayFns = (fns) => {
    for(let i=0;i<fns.length;i++){ // vue2 中也是 调用时让函数依次执行
        fns[i]()
    }
  }

export const onBeforeMount = createHooks(LifeCycleHooks.BEFORE_MOUNT);

export const onMounted = createHooks(LifeCycleHooks.MOUNTED);

export const onBeforeUpdate = createHooks(LifeCycleHooks.BEFORE_UPDATE);

export const onUpdated = createHooks(LifeCycleHooks.UPDATED);
