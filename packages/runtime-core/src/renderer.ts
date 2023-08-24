import { ShapeFlags } from "packages/shared/src/shapeFlag";
import { createAppApi } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";
import { effect } from "@vue/reactivity";
import { isObject } from "@vue/shared";
import { createVNode, normalizeVNode, Text } from "./vNode";
import { queueJob } from "./queueJob";
import { invokeArrayFns } from "./apiLifeCycle";

export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    // parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    // setScopeId: hostSetScopeId = NOOP,
    // insertStaticContent: hostInsertStaticContent
  } = renderOptions;

  // 告诉 core 如何渲染
  // ----------------------------组件相关---------------------

  const setupRenderEffect = (instance, container) => {
    // 需要创建一个 effect ,在effect中调用render方法，这样 render方法中拿到的数据会收集这个effect依赖, 属性更新时， effect 会重新执行
    // instance.render()

    //
   instance.update =  effect(
      function componentEffect() {
        // 每个组件都有一个 effect, vue3是组件级更新，数据变化会重新执行对应的effect
        if (!instance.isMounted) {
          //  初次渲染

          // 
          let {bm, m} = instance
          if(bm){
            invokeArrayFns(bm)
          }


          let proxyToUse = instance.proxy;
          // vue2.x $vnode _vbnode
          // vue3.x  vnode subTree
          let subTree = (instance.subTree = instance.render.call(
            proxyToUse,
            proxyToUse
          ));
          console.log(subTree);
          //   用render的返回值继续渲染
          patch(null, subTree, container);
          instance.isMounted = true;

          if(m){ // mounted 要求必须在自组建完成后才能调自己
            invokeArrayFns(m)
          }

        } else {

          let {bm, u} = instance
          if(bm){
            invokeArrayFns(bm)
          }
          // 更新逻辑
          // diff 算法(核心 diff + 序列优化 + watchApi  生命周期)
          const prevTree = instance.subTree;
          let proxyToUse = instance.proxy;
          const nextTree = instance.render.call(proxyToUse, proxyToUse);
          console.log(prevTree, nextTree);
          patch(prevTree, nextTree, container);

          if(u){
            invokeArrayFns(u)
          }
        }
      },
      {
        scheduler: queueJob,
      }
    );
  };

  const mountComponent = (initialVNode, container) => {
    // 组件渲染流程， 最核心就是调用 setup拿到返回值， ，获取 render函数返回的结果
    // 1、先有实例
    const instance = (initialVNode.component =
      createComponentInstance(initialVNode));
    // 2、需要将数据解析到实例上
    setupComponent(instance);
    // 3、创建一个 effect 让render函数执行
    setupRenderEffect(instance, container);
  };

  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      // 初始化情况， n1为null
      mountComponent(n2, container);
    } else {
      // 组件更新流程
    }
  };
  // ----------------------------组件相关---------------------

  //----------------------------元素相关---------------------

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalizeVNode(children[i]);
      patch(null, child, container);
    }
  };

  const mountElement = (vnode, container, anchor) => {
    // 递归渲染
    const { props, shapeFlag, type, children } = vnode;
    let el = (vnode.el = hostCreateElement(type));

    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children); // 文本直接塞进去
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }

    hostInsert(el, container, anchor);
  };

  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      for (let key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
          hostPatchProp(el, key, prev, next);
        }
      }

      for (let key in oldProps) {
        if (!(key in oldProps)) {
          hostPatchProp(el, key, oldProps, null);
        }
      }
    }
  };

  const unMountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unMount(children[i]);
    }
  };

  const patchKeyedChildren = (n1, n2, container) => {
    // 对特殊情况进行优化
    let i = 0; // 默认从头开始
    let e1 = n1.length - 1;
    let e2 = n2.length - 1;

    // 尽可能减小比对区域
    // sync from start, 从头开始对比，遇到不同停止
    while (i < e1 && 1 < e2) {
      const d1 = n1[i];
      const d2 = n2[i];
      if (isSameVNodeType(d1, d2)) {
        patch(d1, d2, container);
      } else {
        break;
      }
      i++;
    }
    // sync from end
    while (i < e1 && 1 < e2) {
      const d1 = n1[e1];
      const d2 = n2[e2];
      if (isSameVNodeType(d1, d2)) {
        patch(d1, d2, container);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    //   比较后有一方完全比完
    //   同序列对比，提那家、删除
    //  common sequence + mount
    //  确定是要挂载， 如果最最终 i < e1 说明旧的少，反之说明旧的多
    if (i < e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < n2.length ? n2[nextPos].el : null;
        while (i <= e2) {
          patch(null, n2[i], container, anchor);
          i++;
        }
      }
    }else if(i > e2) {
        while(i < e1){
            unMount(n1[i])
            i++
        }
    }else{
        // 乱序比较，需要尽可能复用。 用心的元素做成映射表，一样的复用
        let s1 = i
        let s2 = i
        // vue3 用的是新的之作映射表 vue2用的是老的做映射表
        const keyToNewIndexMap = new Map()
        for(let i = s2; i<= e2; i++){
            const childNode = n2[i]
            keyToNewIndexMap.set(childNode.key, i)
        }
        
        let toBePatched = e2 - s2 + 1
        let newAIndexToOldIndexMap = new Array(toBePatched).fill(0)
        // 去老的元素中查找，看有没有可服用
        for(let i=s1; i<= e1; i++){
            const oldVnode = n1[i]
            let newIndex = keyToNewIndexMap.get(oldVnode.key)
            if(newIndex === undefined){
                unMount(oldVnode)
            }else{ // 新老比对
              // 新和旧的关系， 索引关系
              newAIndexToOldIndexMap[newIndex - s2] = i + 1
                patch(oldVnode, n2[i].key, container)
            }
        }


        // 最长新索引序列
        let increasingNewIndexSequence = getSequence(newAIndexToOldIndexMap)
        let j = increasingNewIndexSequence.length -1 // 取出最后一项索引

        for(let i=toBePatched-1; i >=0;i--){
          let currentIndex = i+s2
          let child = n2[currentIndex]
          let anchor = currentIndex + 1 < n2.length ? n2[currentIndex + 1].el : null

          // 第一次插入后，插入的元素是个虚拟节点，插入后，虚拟节点会有真实节点


          // 如果自己是0 说明patch过 
          if(newAIndexToOldIndexMap[i] == 0){
            patch(null, child,container, anchor)
          }else{
            // 操作当前的元素，以当前元素的下一个作为参照物
            // 这种操作需要将节点全部操作一遍

            if(i !== increasingNewIndexSequence[j] ){
              hostInsert(child.el, container,anchor)
            }else{
              j-- // 跳过不需要移动的元素， 为了减少移动
            }

            
          }
        }

        // 最后就是移动节点，并且将新增的节点插入
        // 最长递增子序列







    }
  };

  const patchChildren = (n1, n2, container) => {
    const c1 = n1.children;
    const c2 = n2.children;
    // 1、旧节点有子元素  2、新的有子节点  3、新旧都有子节点 4、文本节点
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 场景一：旧的 是n个子元素， 新的是文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unMountChildren(c1);
      }

      // 场景二： 两个节点文本情况
      if (c2 !== c1) {
        hostSetElementText(container, c2);
      }
    } else {
      // 场景三： 旧的可能是文本或者数组， 新的是元素
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 当前是数组， 原来可能是数组 或文本
          // 两个数组对比 --》 diff算法 8***

          patchKeyedChildren(n1, n2, container);
        } else {
          // 没有子元素, 特殊情况，当前是 null
          unMountChildren(c1);
        }
      } else {
        //  上一次是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(container, "");
        }

        //
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, container);
        }
      }
    }
  };

  //   当节点相同，更新属性
  const patchElement = (n1, n2, container) => {
    // 元素相同节点

    let el = (n2.el = n1.el);

    //更新属性， 更新子元素
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(oldProps, newProps, el);

    patchChildren(n1, n2, container);
  };

  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 元素挂载
      mountElement(n2, container, anchor);
    } else {
      // 元素更新
      patchElement(n1, n2, container);
    }
  };

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      // hostCreateText 把字符串转化为虚拟->dom元素
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    }
  };

  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  };
  const unMount = (n1) => {
    hostRemove(n1.el);
  };

  const patch = (n1, n2, container, anchor = null) => {
    // 针对不同类型， 做不同初始化
    const { shapeFlag, type } = n2;

    if (n1 && !isSameVNodeType(n1, n2)) {
      // 吧旧节点卸载掉， 换n2
      anchor = hostNextSibling(n1.el);
      unMount(n1);
      n1 = null;
    }

    switch (type) {
      case Text: {
        processText(n1, n2, container);
        break;
      }
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          //   console.log("元素");
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          //   console.log("组件");
          processComponent(n1, n2, container);
        }
    }
  };

  const render = (vnode, container) => {
    //  core 核心， 根据不同的虚拟节点，创建对应的真实元素

    // 默认 调用render 可能是初始化流程
    /**
     * params1 初始化之前没有虚拟节点
     * params2 表示当前要渲染的虚拟节点
     * params3 要渲染的容器
     */
    patch(null, vnode, container);
  };

  return {
    createApp: createAppApi(render),
  };
}

// createRenderer 目的创建一个渲染器

// 框架流程特点： 都是将组件转化为虚拟 DOM --> 虚拟dom生成真是dom挂载到真是页面上

function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}