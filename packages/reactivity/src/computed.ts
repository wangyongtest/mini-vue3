import { isFunction } from "@vue/shared";
import {effect,track, trigger} from './effect'
import {TrackOpTypes, triggerOrTypes} from './operators'


// 缓存 computed effect（lazy）+scheduler + 缓存标识

class ComputedRefImpl{
    public _dirty = true // 默认取值时不要用缓存
    public _value
    public effect
    // 计算属性本身就是一个effect
    constructor(getter,public setter){ // ts中默认不会挂载到this上
        this.effect = effect(getter,{ // 计算属性会默认产生一个effect,默认不执行,只有取值时才执行
            lazy:true,
            scheduler: ()=>{
                if(!this._dirty){
                    this._dirty = true
                    trigger(this, triggerOrTypes.SET, 'value')
                }
            }
        })
       
    }
    get value(){ // vue2中计算双属性不具备收集依赖
        if(this._dirty){ // 如果是脏的(第一次)会执行effect
          this._value =   this.effect() // 执行会将用户返回值返回
          this._dirty = false
        }
        // 这里作收集依赖
        // 收集依赖场景::
        // let age = ref(18);
        // const myAge = computed(() => {
        //   console.log("runner");
        //   return age.value + 10;
        // });
  
        // effect(() => {
        //   console.log(myAge.value);
        // });
        // age.value = 500;

        track(this, TrackOpTypes.GET, 'value')
        // 这样多次执行后智慧取第一次执行的结果
        return this._value
    }

    set value(newVal){
        this.setter(newVal)
    }
}

//  vue2 和 vue3computed 原理不一样
export function computed(getterOrOptions){
    let getter;
    let setter;

    if(isFunction(getterOrOptions)){
        getter = getterOrOptions
        setter = () => {
            console.warn('computed value must be readonly')
        }
    } else{
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }
    // 创建计算属性
    return new ComputedRefImpl(getter,setter)
}