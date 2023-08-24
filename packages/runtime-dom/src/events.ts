
// 1、给元素缓存一个绑定事件的列表
// 2、如果缓存中没有缓存过的，而且value有值，需要绑定，并且缓存起来
// 3、之前绑定过事件，需要删除，删除缓存
// 4、如果前后都有值，直接改变 invoker中value属性指向最新事件
export const patchEvent = (el,key,value)=>{ // vue 指令 删除、添加
    // 对函数的缓存，原因可能是删除
    const invokers = el._vei || (el.vei = {}) // vue event invoker
    const exists = invokers[key] // 事件不存在
    if(value &&exists  ){ // 需要绑定事件，而且事件还存在
        exists.value = value
    }else{
        const eventName = key.slice(2).toLowerCase()
        if(value){ // 需要绑定事件，之前没绑定过
           let invoker = invokers[key] = createInvoker(value)
            el.addEventListener(eventName, invoker)
        }else{
            // 之前绑定了，现在没有需要移除
            el.removeEventListener(eventName, exists)
            invokers[key] = undefined
        }
    }

}

// value = fn
// div @click = "fn" () =>value()
// div

function createInvoker(value){
    const invoker = (e) => {
        invoker.value(e)
    }
    invoker.value = value // 为了随时更改value
    return invoker
}