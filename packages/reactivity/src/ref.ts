
import { hasChanged, isArray, isObject } from '@vue/shared';
import {track,trigger} from './effect'
import { TrackOpTypes, triggerOrTypes } from './operators';
import { reactive } from './reactive';
// ref 和 reactive 的区别， reactive内部采用 proxy  ref 内部使用 defineProperty
export function ref(value){
    // 将普通类型 变成一个对象。可以是对象，但是一般情况下直接使用 reactive
   return createRef(value)
}

export function shallowRef(value){
    // 将普通类型 编程一个对象
   return createRef(value, true)
}

// 这里判断如果是对象则用 reactive包裹， 否则 返回对象
const convert = (val) => isObject(val) ? reactive(val): val

class RefImpl{
    public _value; // 表示 声明看了一个——value属性，但是没有赋值
    public __v_isRef = true
    constructor(public rawValue, public shallow){ // 参数前边增加修饰符， 表示此属性放到了实例上
        
        // 
    this._value = shallow ?  rawValue: convert(rawValue)
    }
    // 类的属性访问器
    get value(){ // 取值取的 value , 会帮我们代理到 _value
        // 取值时调用track()
        track(this, TrackOpTypes.GET, 'value')
        return this._value
    }

    set value(newValue){
        if(hasChanged(newValue, this.rawValue)){
            this.rawValue = newValue // 新增 会作为旧值， 下次在变动时进行对比
            this._value =  this.shallow ?  newValue : convert(newValue)
            trigger(this, triggerOrTypes.SET, 'value',newValue)
        }
       
    }
}

function createRef(rowValue, shallow=false){
return new RefImpl(rowValue, shallow)
}

class ObjectRefImpl{
    public __v_isRef = true
    constructor(public target, public key){

    }
    get value(){// 代理
        //  如果原对象是响应式就会收集依赖
        return this.target[this.key]
    }

    set value(newValue){
        // 如果远对象是响应式的，那么就会触发更新
        this.target[this.key] = newValue
    }
}

// 可以吧一个对象的值转化为ref类型
// 将某一个key 对应的值转化为ref
export function toRef(target, key){
    return new ObjectRefImpl(target, key)

}

// 这个object可能时 object 也可能是个 array
export function toRefs(object){
    // 这里做一个判断 如果是数组，创建一个相同长度的数组
    const ret = isArray(object) ? new Array(object.length) : {}
    // 循环调用，把所有的属性都转为 key:value形式
    for(let key in object){
        ret[key] = toRef(object,key)
    }
}