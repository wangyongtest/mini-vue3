import { hasOwn } from "@vue/shared"

export const PublicInstanceProxyHandlers = {
    get({_:instance}, key){
        // 可以取值时 要访问 setState props 
        const {setupState, props,data} = instance
        if(key[0] === '$'){
            return // 不能访问 $ 开头的变量
        }
        if(hasOwn(setupState,key)){
            return setupState[key]
        }else if(hasOwn(props, key)){
            return props[key]
        }else if(hasOwn(data, key)){
            return data[key]
        }
    },
    set({_:instance}, key, value){
        const {setupState, props,data} = instance
        if(hasOwn(setupState,key)){
            setupState[key] = value
        }else if(hasOwn(props, key)){
             props[key] = value
        }else if(hasOwn(data, key)){
             data[key] = value
        }
    }
}