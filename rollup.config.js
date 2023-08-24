// rollup 配置

// console.log(process.env.TARGET, "rollup");

const path = require("path");
const json = require("@rollup/plugin-json");
const resolvePlugin = require("@rollup/plugin-node-resolve");
const ts = require("rollup-plugin-typescript2");

// 根据环境变量中的 target 属性 获取对应模块的 package.json

const packagesDir = path.resolve(__dirname, "packages");
console.log(packagesDir, "packagesDir");

// 找到要打包的某个包
// packageDir 打包的基准目录（注意：这里有几个包，走几次）
const packageDir = path.resolve(packagesDir, process.env.TARGET);

// 永远针对的是摸个模块
const resolve = (p) => path.resolve(packageDir, p);

const pkg = require(resolve("package.json"));
// console.log(pkg);

// 对打包类型先做映射表，根据提供的formats来格式化要打包的内容

const name = path.basename(packageDir); // 取文件名，就是package.json下 module对应的名字
const outPutConfig = {
  "esm-bundler": {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: "es",
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: "cjs",
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: "iife", // 立执行函数
  },
};

// 自定义的package.json配置选项
const options = pkg.buildOptions;
function createConfig(format, output) {
  output.name = options.name;
  output.sourcemap = true; // 生成sourcemap
  //   横撑 rollup配置
  return {
    input: resolve(`src/index.ts`),
    output,
    plugins: [
      json(),
      ts({
        // ts 插件
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
      resolvePlugin(), // 解析电放模块
    ],
  };
}

// rollup 最终需要导出配置
export default options.formats.map((format) =>
  createConfig(format, outPutConfig[format])
);

// export default result;
