// 只对一系列属性操作

import { patchAttrs } from "./attrs";
import { patchClass } from "./class";
import { patchEvent } from "./events";
import { patchStyles } from "./styles";

/**
 *
 * @param el 节点
 * @param key 属性名
 * @param prevValue 上一次值
 * @param nextValue 下一次值
 */
export const patchProp = (el, key, prevValue, nextValue) => {
  console.log(key);
  
  switch (key) {
    case "class":
      patchClass(el, nextValue);
      break;
    case "style":
      patchStyles(el,prevValue, nextValue);
      break;
    case "attrs":
        // !TODO: 如果不是事件,第六章

        if(/^on[^a-z]/.test(key)){
            // 事件 以 on开头， 如：onClick
            patchEvent(el,key,nextValue)
        }else{
            patchAttrs(el,key,nextValue);
        }
      break
    default:
      break;
  }
};
