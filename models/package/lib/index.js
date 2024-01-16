"use strict";

const path = require("path");
const fse = require("fs-extra");
const pkgDir = require("pkg-dir").sync;
const npmInstall = require("npminstall");
const pathExists = require("path-exists").sync;

const { isObject } = require("@whz-cli-dev/utils");
const formatPath = require("@whz-cli-dev/format-path");
const {
  getDefaultRegistry,
  getNpmLatestVersion,
} = require("@whz-cli-dev/get-npm-info");

class Package {
  constructor(options) {
    if (!options) {
      throw new Error("Package类的options参数不能为空！");
    }
    if (!isObject(options)) {
      throw new Error("Package类的options参数必须为对象！");
    }
    // package的目标路径
    this.targetPath = options.targetPath;
    // 缓存package的路径
    this.storeDir = options.storeDir;
    // package的name
    this.packageName = options.packageName;
    // package的version
    this.packageVersion = options.packageVersion;

    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace("/", "_");
  }

  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirpSync(this.storeDir);
    }
    if (this.packageVersion === "latest") {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }

  get cacheFilePath() {
    // _@whz-cli-dev_core@0.0.5@@whz-cli-dev/
    ///Users/whz/.whz-cli/dependencies/node_modules/_@whz-cli-dev_core@0.0.5@@whz-cli-dev/core
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    );
  }

  getSpecifcCacheFilePath(packageVersion) {
    this.storeDir,
      `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`;
  }

  // 判断package是否存在
  async exists() {
    if (this.storeDir) {
      // 缓存
      await this.prepare();
      console.log("cachheFilePath ===", this.cacheFilePath);
      return pathExists(this.cacheFilePath);
    } else {
      console.log("path true ====");
      return pathExists(this.targetPath);
    }
  }

  // 安装package
  async install() {
    await this.prepare();
    return npmInstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion,
        },
      ],
    });
  }

  // 更新package
  async update() {
    await this.prepare();
    //获取最新版本号
    const latestVersion = await getNpmLatestVersion(this.packageName);
    console.log("版本号最新-====", latestVersion);

    // 查询最新版本号对应的路径是否存在
    const latestFilePath = this.getSpecifcCacheFilePath(latestVersion);
    // 如果不存在，则直接安装
    if (!pathExists(latestFilePath)) {
      this.packageVersion = latestVersion;
      return npmInstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.packageName,
            version: latestVersion,
          },
        ],
      });
    }
  }

  // 获取入口文件的路径
  getRootFilePath() {
    function _getRootPath(targetPath) {
      // 获取package.json的所在目录，pgk-dir库
      const dir = pkgDir(targetPath);
      if (dir) {
        // 读取package.json，require
        const pkgFile = require(path.resolve(dir, "package.json"));
        // 寻找main/lib
        if (pkgFile && pkgFile.main) {
          // 路径的兼容 macos/windows
          return formatPath(path.resolve(dir, pkgFile.main));
        }
      }
      return null;
    }

    if (this.storeDir) {
      return _getRootPath(this.cacheFilePath);
    }
    return _getRootPath(this.targetPath);
  }
}

module.exports = Package;
