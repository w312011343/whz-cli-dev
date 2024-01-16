"use strict";

const path = require("path");
const Package = require("@whz-cli-dev/package");
const log = require("@whz-cli-dev/log");

module.exports = exec;

const SETINGS = {
  init: "@whz-cli-dev/core",
};

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  log.verbose("targetPath ===", targetPath);
  log.verbose("homePath ===", homePath);

  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETINGS[cmdName];
  const packageVersion = "latest";
  // const packageVersion = "0.0.5";
  const CACHE_DIR = "dependencies";
  let storeDir = "";
  let pkg = "";
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR); // 生成缓存路径
    storeDir = path.resolve(targetPath, "node_modules");
    log.verbose("targetPath ===", targetPath);
    log.verbose("storeDir ===", storeDir);

    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });
    if (await pkg.exists()) {
      // 更新package
      console.log("更新哈哈哈");
      await pkg.update();
    } else {
      // 安装package
      console.log("install ====");

      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  // 测试targetPath存在时候，判断逻辑是否正常，即非缓存模式
  console.log("path exists ", await pkg.exists());

  const rootPath = pkg.getRootFilePath();
  console.log("rootPah ===", rootPath);

  if (rootPath) {
    require(rootPath).apply(null, arguments);
  }
}
