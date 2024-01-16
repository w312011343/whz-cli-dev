"use strict";

module.exports = cores;

const path = require("path");
const semver = require("semver");
const colors = require("colors/safe");
const userHome = require("user-home");
const pathExists = require("path-exists").sync;
const commander = require("commander");

const pkg = require("../package.json");
const log = require("@whz-cli-dev/log");
const exec = require("@whz-cli-dev/exec");
const constant = require("./const");

const program = new commander.Command();

async function cores() {
  try {
    await preParse();
    registerCommand();
    log.verbose("debug", "test debug log");
  } catch (e) {
    log.error(e.message);
    if (process.env.LOG_LEVEL === "verbose") {
      console.log(e);
    }
  }
}

// 参数检查
async function preParse() {
  checkPkgVersion();
  checkNodeVersioon();
  checkRoot();
  checkUserHome();
  // checkInputArgs();
  checkEnv();
  await checkGlobalUpdate();
}

// 注册命令
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d, --debug", "是否开启调试模式", false)
    .option("-tp, --targetPath <targetPath>", "是否指定本地调试文件路径", "");

  // 命令注册
  program
    .command("init [projectName]")
    .option("-f,--force", "是否强制初始化项目")
    .action(exec);

  // 监听debug
  program.on("option:debug", () => {
    process.env.LOG_LEVEL = "verbose";
    log.level = process.env.LOG_LEVEL;
  });

  // 指定targetPath
  program.on("option:targetPath", () => {
    process.env.CLI_TARGET_PATH = program._optionValues.targetPath;
  });

  // 对未知命令监听
  program.on("command:*", (obj) => {
    const availableComands = program.commands.map((cmd) => cmd.name());
    console.log(colors.red("未知的命令：" + obj[0]));
    if (availableComands.length) {
      console.log(colors.yellow("可用命令：" + availableComands.join(",")));
    }
  });

  program.parse(process.argv);

  // 没有输入参数，就输出帮助文档
  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

// 检查版本
async function checkGlobalUpdate() {
  const currentVer = pkg.version;
  const npmName = pkg.name;
  const {
    getNpmInfo,
    getNpmSemverVersion,
  } = require("@whz-cli-dev/get-npm-info");
  // 获取当前版本号和模块名
  const lastVer = await getNpmSemverVersion(currentVer, npmName);
  if (lastVer && semver.gt(lastVer, currentVer)) {
    log.warn(
      colors.yellow(`请手动更新${npmName}，当前版本：${currentVer}，最新版本：${lastVer}
      更新命令：npm i -g ${npmName}`)
    );
  }
}

// 检查环境变量
function checkEnv() {
  const dotEnv = require("dotenv");
  const dotEnvPath = path.resolve(userHome, ".env"); //环境变量的env文件
  let config = null;
  if (pathExists(dotEnvPath)) {
    config = dotEnv.config({
      path: dotEnvPath,
    });
  }
  createDefaultConfig();
  log.verbose("环境变量", config, process.env.CLI_HOME_PATH);
}

function createDefaultConfig() {
  const cliConf = {
    home: userHome,
  };
  if (process.env.CLI_HOME_PATH) {
    cliConf["cliHome"] = path.join(userHome, process.env.CLI_HOME_PATH);
  } else {
    cliConf["cliHome"] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConf.cliHome;
}

// 检查输入参数
function checkInputArgs() {
  const minimist = require("minimist");
  const args = minimist(process.argv.slice(2));
  checkArgs(args);
}

function checkArgs(args) {
  if (args.debug) {
    process.env.LOG_LEVEL = "verbose";
  } else {
    process.env.LOG_LEVEL = "info";
  }
  log.level = process.env.LOG_LEVEL;
}

// 检查主目录
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red("当前登录用户主目录不存在!"));
  }
}

// 检查是否是主用户执行
function checkRoot() {
  const rootCheck = require("root-check");
  rootCheck();
  console.log("用户ID", process.geteuid()); //mac whz-dev-cli默认用户501,sudo  whz-dev-cli默认用户0
}

// 校验项目版本号
function checkPkgVersion() {
  log.notice("cli", pkg.version);
}

function checkNodeVersioon() {
  // 第一步 检查当前node版本号
  const currentVer = process.version;
  console.log("currentVer ===", currentVer);

  // 第二步 检查最低要求版本号
  const LOWEST_NODE_VERSION = constant.LOWEST_NODE_VERSION;
  if (!semver.gte(currentVer, LOWEST_NODE_VERSION)) {
    throw new Error(
      colors.red(`cli-dev 需要安装v${LOWEST_NODE_VERSION}以上版本的node.js`)
    );
  }
}
