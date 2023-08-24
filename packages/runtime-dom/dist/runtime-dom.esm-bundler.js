// 判断是否为对象，切不能为 null
const isObject = (value) => typeof value === 'object' && value !== null;
const extend = Object.assign;
const isArray = Array.isArray;
const isFunction = (value) => typeof value === 'function';
const isString = value => typeof value === 'string';
const isIntegerKey = key => parseInt(key) + '' === key; // 整形字符串 => 索引(更新索引)
// 
let hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (target, key) => hasOwnProperty.call(target, key);
const hasChanged = (newVal, oldVal) => newVal !== oldVal;

const nodeOps = {
    // createElement , 不同平台创建元素不同
    createElement: tagName => document.createElement(tagName),
    remove: child => {
        const parent = child.parentNode;
        if (parent) {
            parent.removeChild(child);
        }
    },
    /**
     *
     * @param child 插入元素
     * @param parent  插入的父节点
     * @param anchor 插入的参照物
     */
    insert: (child, parent, anchor = null) => {
        parent.insertBefore(child, anchor); // 如果参照物为空，则相当于 appendChild
    },
    querySelect: selector => document.querySelector(selector),
    setElementText: (el, text) => el.textContent = text,
    // 文本操作
    createText: (text) => document.createTextNode(text),
    setText: (node, text) => node.nodeValue = text,
    nextSibling: (node) => node.nextSibling
};

const patchAttrs = (el, key, value) => {
    if (value == null) {
        el.removeAttribute(key);
    }
    else {
        el.setAttribute(key, value);
    }
};

const patchClass = (el, value) => {
    if (value == null) {
        value = '';
    }
    el.className = value;
};

// 1、给元素缓存一个绑定事件的列表
// 2、如果缓存中没有缓存过的，而且value有值，需要绑定，并且缓存起来
// 3、之前绑定过事件，需要删除，删除缓存
// 4、如果前后都有值，直接改变 invoker中value属性指向最新事件
const patchEvent = (el, key, value) => {
    // 对函数的缓存，原因可能是删除
    const invokers = el._vei || (el.vei = {}); // vue event invoker
    const exists = invokers[key]; // 事件不存在
    if (value && exists) { // 需要绑定事件，而且事件还存在
        exists.value = value;
    }
    else {
        const eventName = key.slice(2).toLowerCase();
        if (value) { // 需要绑定事件，之前没绑定过
            let invoker = invokers[key] = createInvoker(value);
            el.addEventListener(eventName, invoker);
        }
        else {
            // 之前绑定了，现在没有需要移除
            el.removeEventListener(eventName, exists);
            invokers[key] = undefined;
        }
    }
};
// value = fn
// div @click = "fn" () =>value()
// div
function createInvoker(value) {
    const invoker = (e) => {
        invoker.value(e);
    };
    invoker.value = value; // 为了随时更改value
    return invoker;
}

const patchStyles = (el, prev, next) => {
    //
    const style = el.style; // 获取样式
    if (next == null) {
        el.removeAttribute("style");
    }
    else {
        // 老的里边新的样式有没有
        if (prev) {
            for (let key in prev) {
                if (next[key] == null) {
                    // 旧的里边有 新的没有  需要删除
                    style[key] = "";
                }
            }
        }
        // 新的里边老的央视有没有
        for (let key in next) {
            style[key] = next[key];
        }
    }
};

// 只对一系列属性操作
/**
 *
 * @param el 节点
 * @param key 属性名
 * @param prevValue 上一次值
 * @param nextValue 下一次值
 */
const patchProp = (el, key, prevValue, nextValue) => {
    console.log(key);
    switch (key) {
        case "class":
            patchClass(el, nextValue);
            break;
        case "style":
            patchStyles(el, prevValue, nextValue);
            break;
        case "attrs":
            // !TODO: 如果不是事件,第六章
            if (/^on[^a-z]/.test(key)) {
                // 事件 以 on开头， 如：onClick
                patchEvent(el, key, nextValue);
            }
            else {
                patchAttrs(el, key, nextValue);
            }
            break;
    }
};

// createVNode 创建虚拟节点 
function isVnode(vNode) {
    return vNode.__v_isVnode;
}
const createVNode = (type, props, children = null) => {
    // 可以根据type 来区分组件 还是普通元素
    // 根据type 区分是元素还是组件
    const shapeFlag = isString(type) ? 1 /* ShapeFlags.ELEMENT */ : isObject(type) ? 4 /* ShapeFlags.STATEFUL_COMPONENT */ : 0;
    // 给虚拟节点添加一个类型
    const vnode = {
        // 一个对象来描述对应内容，虚拟节点有跨平台能力
        __v_isVnode: true,
        type,
        props,
        children,
        component: null,
        el: null,
        key: props && props.key,
        shapeFlag // 判断出当前元素和子元素的类型
    };
    normalizeChildren(vnode, children);
    return vnode;
};
function normalizeChildren(vnode, children) {
    let type = 0;
    if (children == null) ;
    else if (isArray(children)) {
        type = 16 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    else {
        type = 8 /* ShapeFlags.TEXT_CHILDREN */;
    }
    vnode.shapeFlag |= type;
}
const Text = Symbol('Text');
function normalizeVNode(child) {
    if (isObject(child))
        return child;
    return createVNode(Text, null, String(child));
}

// 
function createAppApi(render) {
    return function createApp(rootComponent, rootProps) {
        const app = {
            _props: rootProps,
            _rootComponent: rootComponent,
            _container: null,
            mount(container) {
                // let vNode = {} 
                // console.log(container,rootComponent,rootProps);
                // render(vNode, container)
                // 1、根据组件创建虚拟节点
                // 2、将虚拟几点和容器获取到后调用render方法进行渲染
                // 虚拟节点
                const vNode = createVNode(rootComponent, rootProps);
                console.log(vNode, 'vNode');
                render(vNode, container);
                // 调用render
                app._container = container;
            }
        };
        return app;
    };
}

const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // 可以取值时 要访问 setState props 
        const { setupState, props, data } = instance;
        if (key[0] === '$') {
            return; // 不能访问 $ 开头的变量
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        else if (hasOwn(data, key)) {
            return data[key];
        }
    },
    set({ _: instance }, key, value) {
        const { setupState, props, data } = instance;
        if (hasOwn(setupState, key)) {
            setupState[key] = value;
        }
        else if (hasOwn(props, key)) {
            props[key] = value;
        }
        else if (hasOwn(data, key)) {
            data[key] = value;
        }
    }
};

//  组件中的所有方法
function createComponentInstance(vnode) {
    // webcomponent 组件需要有 属性  插槽 
    const instance = {
        vnode,
        type: vnode.type,
        props: {},
        attrs: {},
        slots: {},
        ctx: null,
        data: {},
        setupState: {},
        isMounted: false,
        render: null
    };
    instance.ctx = { _: instance }; // instance.ctx._
    return instance;
}
function setupComponent(instance) {
    const { props, children } = instance.vnode;
    // 根据props 解析出props 和attrs, 将其放到instance
    instance.props = props;
    instance.children = children;
    // 需要先看下当前组建是不是有状态的组件， 函数组件
    let isStateFul = instance.vnode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */;
    if (isStateFul) { // 表示当前是一个带状态的组件
        // 调用当前实例 setup 方法，用setup 返回值填充 setupState 和对应的render 方法
        setupStateFulComponent(instance);
    }
}
let currentInstance = null;
let setCurrentInstance = (instance) => {
    currentInstance = instance;
};
let getCurrentInstance = () => {
    // 在setup中， 获取当前实例
    return currentInstance;
};
function setupStateFulComponent(instance) {
    // 1、代理 传递给render函数的参数
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
    //  2、获取组建的类型， 拿到组建的 setup方法
    let Component = instance.type;
    let { setup } = Component;
    // ----------------------
    if (setup) {
        currentInstance = instance;
        let setContext = createSetupContext(instance);
        const setupResult = setup(instance.props, setContext); // instance 中的 props attrs slots emit expose 提取出来
        currentInstance = null;
        handlerSetupResult(instance, setupResult);
    }
    else {
        finishComponentSetup(instance); // 完成组建的启动
    }
}
function handlerSetupResult(instance, setupResult) {
    if (isFunction(setupResult)) {
        instance.render = setupResult;
    }
    else if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    let Component = instance.type;
    if (!instance.render) {
        //  对template 模版进行编译， 产生render函数
        if (!Component.render && Component.template) ;
        instance.render = Component.render; // 需要将生成的render函数挂在实力上
    }
    console.log(instance);
    // console.log(instance.render.toString());
    // 对vue2.0+ 做了兼容处理
    // applyOptions
}
function createSetupContext(instance) {
    return {
        attrs: instance.attrs,
        slots: instance.slots,
        emit: () => { },
        expose: () => { }
    };
}
//  instance 表示组件的状态，各种状态， 组件的相关信息
// context 就四个参数， ，为了开发时使用
// render函数参数  proxy 主要是为了取值方便 ==> instance.proxy

// effect 接收两个参数， 第一为函数，第二个为配置项
function effect(fn, options = {}) {
    // 目的：让effect变为响应式，数据变化进行重新执行
    const effect = createReactiveEffect(fn, options);
    // 如果属性中由lazy，说明是懒执行，首次不执行，柔则执行
    if (!options.lazy) {
        // 响应式默认会执行一次
        effect();
    }
    return effect;
}
// 给 effect 添加标识(全局标识)
let uid = 0;
let activeEffect; // 存储当前的effect
const effectStack = [];
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        // 解决场景二
        // 判断栈中是否存在 effect, 不存在则放入栈中【保证effect没有加入到effectStack中】
        if (!effectStack.includes(effect)) {
            // 这里的执行可能会出错，使用try
            try {
                // 入栈
                effectStack.push(effect);
                activeEffect = effect;
                // 函数的执行会取值，取值会触发 createGetter方法
                return fn();
            }
            finally {
                // 执行完了之后出栈
                effectStack.pop();
                // 吧activeEffect 设置为 最后一个 effect
                // 这样就能保证 track 中的key 与 activeEffect对应上
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    };
    // 只做标识
    effect.id = uid++;
    // 用于标识这个effect是个响应式effect
    effect._isEffect = true;
    // 保留 effect对应的原函数，创建映射关系
    effect.raw = fn;
    // 保存用户属性
    effect.options = options;
    return effect;
}
// 收集依赖
// 能够拿到当前的 effect
// 让某个对象中的属性收集当他对应的effect函数
const targetMap = new WeakMap();
function track(target, type, key) {
    //   至此各个effect之间的对应关系已经对应上
    // console.log(target, type, activeEffect);
    //   接下来属性和effect关联
    if (activeEffect === undefined) {
        // 此属性不需要收集依赖，因为没在effect中使用
        return;
    }
    // 查看 weakMap 是否存在 target
    let depsMap = targetMap.get(target);
    // 不存在添加， key:Object value: Map
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    // 在map 对象上查找对应key,
    let dep = depsMap.get(key);
    // 不存在 设置 此map 对象 key ,value： Set
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    // 当前 ket 的value中是否存在 activeEffect,  不存在，添加进去
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
    }
    // console.log(targetMap, "targetMap");
}
// 触发更新
// 找属性对应的 effect 让其执行 （数组、 对象）
function trigger(target, type, key, newValue, oldValue) {
    //
    // console.log(target, type, key, newValue, oldValue);
    // 如果当前属性没有收集过 effect, 不需要作任何操作
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    // 将所有的要执行的effect 全部存到一个新的集合中，最后统一执行
    //   这里对 effect进行额去重
    const effects = new Set();
    const add = (effectToAdd) => {
        if (effectToAdd) {
            effectToAdd.forEach((effect) => effects.add(effect));
        }
    };
    // 1、判断修改的是不是数组的长度，因为修改的是数组长度，影响较大
    if (key === "length" && isArray(target)) {
        // 如果对应的长度 有依赖是收集（注释：数组长度大于更新的长度）
        depsMap.forEach((dep, key) => {
            // console.log(dep, key);
            // 修改长度必收集的索引小
            if (key === "length" || key > newValue) {
                // 如果更改的长度 小鱼收集的索引，那么这个索引也需要触发 effect重新更新
                // dep 是个map对象
                add(dep);
            }
        });
    }
    else {
        // 可能是对象
        if (key !== undefined) { // 修改，不可能新增
            add(depsMap.get(key)); // 
        }
        // 如果修改数组中的某一个索引
        // 如果是添加了一个树荫就出发长度的更新
        switch (type) {
            case 0 /* triggerOrTypes.ADD */: {
                if (isArray(target) && isIntegerKey(key)) {
                    add(depsMap.get('length'));
                }
            }
        }
    }
    effects.forEach((effect) => {
        if (effect.options.scheduler) {
            effect.options.scheduler(effect);
        }
        else {
            effect();
        }
    });
}
/**场景**/
// 第一步：使用一个map 对象， key:｛name:test,age:123｝ value： map对象，这个对象的 key:name value:set
// weakMap: key =》｛name:test,age:123｝  value：(map) => ｛name=> set｝
// {name: 'test', age: 123} => name => [effect,effect]
// 同时出现多个相同的effect
// effect(()=>{
//     state.name
// })
// effect(()=>{
//     state.name
// })
// 由于使用了一个全局变量activeEffect,会出现问题，这里模拟出现问题的场景
// 当出现函数嵌套时， 那么这个activeEffect就无法对应了
// 解决方案;effectStack栈
// 场景一 函数调用是一个栈结垢
// effect(()=>{         effect1
//     state.name       effect1
//     effect(（）=>{    effect1
//         state.age     effect2
//     })
//     state.addres     effect2
// })
// 当出现这中情况时，会出现死循环
// 场景二
// effect(() => {
//     state.num++
// })

// 由于拦截方法不一样
// 实现 new Proxy(target, handler)
// 核心拦截
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        // proxy + reflect
        //  补充：后续Object上的方法 会被转移到 Reflect, Reflect.getProptypeof（）
        //  之前 target[key]=value方式设置可能会失败，并不会报异常，也没有返回值标识
        // Reflect方法具备返回值
        //  Reflect 使用可以不使用 proxy
        const res = Reflect.get(target, key, receiver);
        if (!isReadonly) {
            // 非只读，收集依赖，数据变化后更新对应视图
            console.log('执行effect是会取值，收集 effect');
            // 
            track(target, 0 /* TrackOpTypes.GET */, key);
        }
        // 浅层==》返回对象
        if (shallow) {
            return res;
        }
        // 看返回时是不是对象，同时是不是readonly:reactive
        // 如果是只是 readonly不是只读递归转为响应式
        // vue2: 一上来就递归，vue3:当取值时会进行代理。vue3:代理模式为懒代理
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
// 核心设置
function createSetter(shallow = false) {
    return function set(target, key, value, receiver) {
        const oldValue = target[key];
        //  1、新增 还是更新。 vue2无法监控更改索引， 无法监控数组长度
        let hasKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
        // proxy + reflect
        const res = Reflect.set(target, key, value, receiver);
        if (!hasKey) {
            // 新增
            trigger(target, 0 /* triggerOrTypes.ADD */, key, value);
        }
        else if (hasChanged(value, oldValue)) {
            // 修改
            trigger(target, 1 /* triggerOrTypes.SET */, key, value);
        }
        console.log('setter');
        // 当数据更新时，通知对应属性的 effect重新执行
        //  场景区分
        return res;
    };
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
const mutableHandlers = {
    get,
    set,
};
const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSetter,
};
let readonlyObj = {
    set: (target, key) => {
    },
};
const readOnlyHandlers = extend({
    get: readonlyGet,
}, readonlyObj);
const shallowReadonlyHandlers = extend({
    get: shallowReadonlyGet,
}, readonlyObj);

function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers);
}
function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers);
}
// 只读的调set方法报错
function readonly(target) {
    return createReactiveObject(target, true, readOnlyHandlers);
}
function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandlers);
}
//  方法的区别 1、是否只读 2、是否深层响应 ==》柯里化
//  new Proxy() 最核心hi需要拦截数据的读取和数据的修改 ==》 拦截 get set
// 04、创建两个 weekMap（）,存储只读和响应式（优点：会自动垃圾回收）
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
function createReactiveObject(target, isReadonly, baseHandlers) {
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

// ref 和 reactive 的区别， reactive内部采用 proxy  ref 内部使用 defineProperty
function ref(value) {
    // 将普通类型 变成一个对象。可以是对象，但是一般情况下直接使用 reactive
    return createRef(value);
}
function shallowRef(value) {
    // 将普通类型 编程一个对象
    return createRef(value, true);
}
// 这里判断如果是对象则用 reactive包裹， 否则 返回对象
const convert = (val) => isObject(val) ? reactive(val) : val;
class RefImpl {
    rawValue;
    shallow;
    _value; // 表示 声明看了一个——value属性，但是没有赋值
    __v_isRef = true;
    constructor(rawValue, shallow) {
        this.rawValue = rawValue;
        this.shallow = shallow;
        // 
        this._value = shallow ? rawValue : convert(rawValue);
    }
    // 类的属性访问器
    get value() {
        // 取值时调用track()
        track(this, 0 /* TrackOpTypes.GET */, 'value');
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this.rawValue)) {
            this.rawValue = newValue; // 新增 会作为旧值， 下次在变动时进行对比
            this._value = this.shallow ? newValue : convert(newValue);
            trigger(this, 1 /* triggerOrTypes.SET */, 'value', newValue);
        }
    }
}
function createRef(rowValue, shallow = false) {
    return new RefImpl(rowValue, shallow);
}
class ObjectRefImpl {
    target;
    key;
    __v_isRef = true;
    constructor(target, key) {
        this.target = target;
        this.key = key;
    }
    get value() {
        //  如果原对象是响应式就会收集依赖
        return this.target[this.key];
    }
    set value(newValue) {
        // 如果远对象是响应式的，那么就会触发更新
        this.target[this.key] = newValue;
    }
}
// 可以吧一个对象的值转化为ref类型
// 将某一个key 对应的值转化为ref
function toRef(target, key) {
    return new ObjectRefImpl(target, key);
}
// 这个object可能时 object 也可能是个 array
function toRefs(object) {
    // 这里做一个判断 如果是数组，创建一个相同长度的数组
    const ret = isArray(object) ? new Array(object.length) : {};
    // 循环调用，把所有的属性都转为 key:value形式
    for (let key in object) {
        ret[key] = toRef(object, key);
    }
}

// 缓存 computed effect（lazy）+scheduler + 缓存标识
class ComputedRefImpl {
    setter;
    _dirty = true; // 默认取值时不要用缓存
    _value;
    effect;
    // 计算属性本身就是一个effect
    constructor(getter, setter) {
        this.setter = setter;
        this.effect = effect(getter, {
            lazy: true,
            scheduler: () => {
                if (!this._dirty) {
                    this._dirty = true;
                    trigger(this, 1 /* triggerOrTypes.SET */, 'value');
                }
            }
        });
    }
    get value() {
        if (this._dirty) { // 如果是脏的(第一次)会执行effect
            this._value = this.effect(); // 执行会将用户返回值返回
            this._dirty = false;
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
        track(this, 0 /* TrackOpTypes.GET */, 'value');
        // 这样多次执行后智慧取第一次执行的结果
        return this._value;
    }
    set value(newVal) {
        this.setter(newVal);
    }
}
//  vue2 和 vue3computed 原理不一样
function computed(getterOrOptions) {
    let getter;
    let setter;
    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions;
        setter = () => {
            console.warn('computed value must be readonly');
        };
    }
    else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    // 创建计算属性
    return new ComputedRefImpl(getter, setter);
}

let queue = [];
function queueJob(job) {
    // 
    if (!queue.includes(job)) {
        queue.push(job);
        // 执行刷新队列
        queueFlush();
    }
}
let isFlushPending = false;
function queueFlush() {
    if (!isFlushPending) {
        isFlushPending = true;
        Promise.resolve().then(flushJobs);
    }
}
function flushJobs() {
    isFlushPending = false;
    // 清空时需要根据调用的顺序依次刷新， 保证先刷新父，在刷新子
    queue.sort((a, b) => a.id - b.id);
    for (let i = 0; i < queue.length; i++) {
        const job = queue[i];
        job();
    }
    queue.length = 0;
}

const injectHooks = (type, hook, target) => {
    // 在此函数中保留了实例(闭包)
    if (!target) {
        return console.warn("injection APIs can only be used during execution of setup()");
    }
    else {
        const hooks = target[type] || (target[type] = []); // instance.bm = []
        //    使用欺骗方法
        const wrap = () => {
            setCurrentInstance(target); // currentInstance = 自己的
            hook.call(target);
            setCurrentInstance(null);
        };
        hooks.push(wrap);
    }
};
const createHooks = (lifeCycle) => (hook, target = currentInstance) => {
    // target 用来表示他是那个市里的钩子
    // 给当前的实例增加对应的生命周期
    injectHooks(lifeCycle, hook, target);
};
const invokeArrayFns = (fns) => {
    for (let i = 0; i < fns.length; i++) { // vue2 中也是 调用时让函数依次执行
        fns[i]();
    }
};
const onBeforeMount = createHooks("bm" /* LifeCycleHooks.BEFORE_MOUNT */);
const onMounted = createHooks("m" /* LifeCycleHooks.MOUNTED */);
const onBeforeUpdate = createHooks("bu" /* LifeCycleHooks.BEFORE_UPDATE */);
const onUpdated = createHooks("u" /* LifeCycleHooks.UPDATED */);

function createRenderer(renderOptions) {
    const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, 
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
        instance.update = effect(function componentEffect() {
            // 每个组件都有一个 effect, vue3是组件级更新，数据变化会重新执行对应的effect
            if (!instance.isMounted) {
                //  初次渲染
                // 
                let { bm, m } = instance;
                if (bm) {
                    invokeArrayFns(bm);
                }
                let proxyToUse = instance.proxy;
                // vue2.x $vnode _vbnode
                // vue3.x  vnode subTree
                let subTree = (instance.subTree = instance.render.call(proxyToUse, proxyToUse));
                console.log(subTree);
                //   用render的返回值继续渲染
                patch(null, subTree, container);
                instance.isMounted = true;
                if (m) { // mounted 要求必须在自组建完成后才能调自己
                    invokeArrayFns(m);
                }
            }
            else {
                let { bm, u } = instance;
                if (bm) {
                    invokeArrayFns(bm);
                }
                // 更新逻辑
                // diff 算法(核心 diff + 序列优化 + watchApi  生命周期)
                const prevTree = instance.subTree;
                let proxyToUse = instance.proxy;
                const nextTree = instance.render.call(proxyToUse, proxyToUse);
                console.log(prevTree, nextTree);
                patch(prevTree, nextTree, container);
                if (u) {
                    invokeArrayFns(u);
                }
            }
        }, {
            scheduler: queueJob,
        });
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
        if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            hostSetElementText(el, children); // 文本直接塞进去
        }
        else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
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
            }
            else {
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
            }
            else {
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
        }
        else if (i > e2) {
            while (i < e1) {
                unMount(n1[i]);
                i++;
            }
        }
        else {
            // 乱序比较，需要尽可能复用。 用心的元素做成映射表，一样的复用
            let s1 = i;
            let s2 = i;
            // vue3 用的是新的之作映射表 vue2用的是老的做映射表
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const childNode = n2[i];
                keyToNewIndexMap.set(childNode.key, i);
            }
            let toBePatched = e2 - s2 + 1;
            let newAIndexToOldIndexMap = new Array(toBePatched).fill(0);
            // 去老的元素中查找，看有没有可服用
            for (let i = s1; i <= e1; i++) {
                const oldVnode = n1[i];
                let newIndex = keyToNewIndexMap.get(oldVnode.key);
                if (newIndex === undefined) {
                    unMount(oldVnode);
                }
                else { // 新老比对
                    // 新和旧的关系， 索引关系
                    newAIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(oldVnode, n2[i].key, container);
                }
            }
            // 最长新索引序列
            let increasingNewIndexSequence = getSequence(newAIndexToOldIndexMap);
            let j = increasingNewIndexSequence.length - 1; // 取出最后一项索引
            for (let i = toBePatched - 1; i >= 0; i--) {
                let currentIndex = i + s2;
                let child = n2[currentIndex];
                let anchor = currentIndex + 1 < n2.length ? n2[currentIndex + 1].el : null;
                // 第一次插入后，插入的元素是个虚拟节点，插入后，虚拟节点会有真实节点
                // 如果自己是0 说明patch过 
                if (newAIndexToOldIndexMap[i] == 0) {
                    patch(null, child, container, anchor);
                }
                else {
                    // 操作当前的元素，以当前元素的下一个作为参照物
                    // 这种操作需要将节点全部操作一遍
                    if (i !== increasingNewIndexSequence[j]) {
                        hostInsert(child.el, container, anchor);
                    }
                    else {
                        j--; // 跳过不需要移动的元素， 为了减少移动
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
        if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
            // 场景一：旧的 是n个子元素， 新的是文本
            if (prevShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                unMountChildren(c1);
            }
            // 场景二： 两个节点文本情况
            if (c2 !== c1) {
                hostSetElementText(container, c2);
            }
        }
        else {
            // 场景三： 旧的可能是文本或者数组， 新的是元素
            if (prevShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    // 当前是数组， 原来可能是数组 或文本
                    // 两个数组对比 --》 diff算法 8***
                    patchKeyedChildren(n1, n2, container);
                }
                else {
                    // 没有子元素, 特殊情况，当前是 null
                    unMountChildren(c1);
                }
            }
            else {
                //  上一次是文本
                if (prevShapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                    hostSetElementText(container, "");
                }
                //
                if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
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
        }
        else {
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
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    //   console.log("元素");
                    processElement(n1, n2, container, anchor);
                }
                else if (shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
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
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function h(type, propsOrChildren, children) {
    const l = arguments.length;
    if (l == 2) { // 属性 + children   || 类型 + children
        //  如果 propsOrChildren 是数组， 直接作为第三个参数
        if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
            if (isVnode(propsOrChildren)) { // 子元素节点， 只能是 字符串 || 数组
                return createVNode(type, null, []);
            }
            return createVNode(type, propsOrChildren);
        }
        else {
            // 如果第二个参数不是对象， 一定是 children
            return createVNode(type, null, propsOrChildren);
        }
    }
    else {
        if (l > 3) {
            children = Array.prototype.slice.call(arguments, 2);
        }
        else if (l === 3 && isVnode(children)) {
            children = [children];
        }
        return createVNode(type, propsOrChildren, children);
    }
}

// 核心 提供 DOM Api, 如：操作节点、操作属性的更新
// 节点操作： 增删改查
// 属性操作： 添加 删除 更新 (样式、类、事件、其他属性)
// 渲染时用到的所有方法
const rendererOptions = extend({ patchProp }, nodeOps);
// vue 中 runtime-core提供了核心的方法，用来处理渲染， 他会使用runtime-dom 中的 api 进行渲染
// 用户调用的时runtime-dom --.> runtime-core
// runtime-dom 是为了解决平台差异
function createApp(rootComponent, rootProps = null) {
    const app = createRenderer(rendererOptions).createApp(rootComponent, rootProps);
    let { mount } = app;
    app.mount = function (container) {
        // 清空容器的操作
        container = nodeOps.querySelect(container);
        container.innerHTML = '';
        // 将组件 渲染成 dom 元素，进行挂载
        mount(container);
    };
    return app;
}

export { computed, createApp, createRenderer, effect, getCurrentInstance, h, onBeforeMount, onBeforeUpdate, onMounted, onUpdated, reactive, readonly, ref, rendererOptions, shallowReactive, shallowReadonly, shallowRef, toRef, toRefs };
//# sourceMappingURL=runtime-dom.esm-bundler.js.map
