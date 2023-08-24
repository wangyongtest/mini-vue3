var VueReactivity = (function (exports) {
    'use strict';

    // 判断是否为对象，切不能为 null
    const isObject = (value) => typeof value === 'object' && value !== null;
    const extend = Object.assign;
    const isArray = Array.isArray;
    const isFunction = (value) => typeof value === 'function';
    const isIntegerKey = key => parseInt(key) + '' === key; // 整形字符串 => 索引(更新索引)
    // 
    let hasOwnProperty = Object.prototype.hasOwnProperty;
    const hasOwn = (target, key) => hasOwnProperty.call(target, key);
    const hasChanged = (newVal, oldVal) => newVal !== oldVal;

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

    exports.computed = computed;
    exports.effect = effect;
    exports.reactive = reactive;
    exports.readonly = readonly;
    exports.ref = ref;
    exports.shallowReactive = shallowReactive;
    exports.shallowReadonly = shallowReadonly;
    exports.shallowRef = shallowRef;
    exports.toRef = toRef;
    exports.toRefs = toRefs;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
