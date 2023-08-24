//  只针对具体的某个包进行打包，比如：当开发 reactivity 时，仅对 reactivity进行打包

const fs = require("fs");
// 开启子进程进行打包，最终还是使用rollup
const execa = require("execa");

// const target = "reactivity";
// const target = "runtime-dom";
const target = "compiler-dom";

// 对我们的目标进行依次打包，并行打包
async function build(target) {
  // rollup  -c --environment TARGET: shared
  // console.log(target);
  await execa("rollup", ["-cw", "--environment", `TARGET:${target}`], {
    stdio: "inherit", // 子进程打包信息共享给父进程
  });
}

build(target);
