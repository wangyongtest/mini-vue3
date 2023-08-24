//  吧 packages 目录下的所有报都进行打包

const fs = require("fs");
// 开启子进程进行打包，最终还是使用rollup
const execa = require("execa");
// console.log(execa);
// 同步读取文件夹
const targets = fs.readdirSync("packages").filter((f) => {
  // 判断 读取到 packages 下的是否为文件夹
  if (!fs.statSync(`packages/${f}`).isDirectory()) {
    return false;
  }
  return true;
});

// 对我们的目标进行依次打包，并行打包
async function build(target) {
  // rollup  -c --environment TARGET: shared
  // console.log(target);
  await execa("rollup", ["-c", "--environment", `TARGET:${target}`], {
    stdio: "inherit", // 子进程打包信息共享给父进程
  });
}

function runParallel(targets, iteratorFn) {
  const res = [];
  for (const item of targets) {
    const p = iteratorFn(item);
    res.push(p);
  }
  return Promise.all(res);
}

runParallel(targets, build);
