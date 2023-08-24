// 判断是否为对象，切不能为 null
const isObject = (value)=> typeof value === 'object'&&value!== null
const extend = Object.assign
const isArray = Array.isArray
const isFunction = (value)=> typeof value === 'function'
const isNumber = value => typeof value === 'number'
const isString = value => typeof value === 'string'
const isIntegerKey = key => parseInt(key) + '' === key // 整形字符串 => 索引(更新索引)

// 
let hasOwnProperty = Object.prototype.hasOwnProperty
const hasOwn = (target,key)=> hasOwnProperty.call(target,key)

const hasChanged = (newVal, oldVal) => newVal !== oldVal


export {
    isObject,
    extend,
    isArray,
    isFunction,
    isNumber,
    isString,
    isIntegerKey,
    hasOwn,
    hasChanged
}