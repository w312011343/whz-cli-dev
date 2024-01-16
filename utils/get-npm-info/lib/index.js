"use strict";

const axios = require("axios");
const urlJoin = require("url-join");
const semver = require("semver");

// 获取NPM 信息
function getNpmInfo(npmName, registry) {
  if (!npmName) {
    return null;
  }
  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urlJoin(registryUrl, npmName);
  return axios
    .get(npmInfoUrl)
    .then((res) => {
      if (res.status === 200) {
        return res.data;
      }
      return null;
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

// 获取npm 源地址
function getDefaultRegistry(isOriginal = false) {
  return isOriginal
    ? "https://registry.npmjs.org"
    : "https://registry.npmmirror.com";
}

// 获取所有版本号
async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}

// 版本比较，获取比当前版本大的版本信息
function getSemverVersions(baseVersion, versions) {
  const data = versions
    .filter((ver) => {
      semver.satisfies(ver, `^${baseVersion}`);
    })
    .sort((a, b) => (semver.gt(b, a) ? 1 : -1));
  return data;
}

// 获取最新版本号
async function getNpmSemverVersion(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry);
  const targetVersions = getSemverVersions(baseVersion, versions);
  if (targetVersions && targetVersions.length) {
    return targetVersions[0];
  }
}

// 获取最新版本
async function getNpmLatestVersion(npmName, registry) {
  const versions = (await getNpmVersions(npmName, registry)) || [];
  if (versions.length) {
    versions.sort((a, b) => {
      return semver.gt(b, a) ? 1 : -1;
    });
    return versions[0];
  }
  return null;
}

module.exports = {
  getNpmInfo,
  getNpmVersions,
  getNpmSemverVersion,
  getDefaultRegistry,
  getNpmLatestVersion,
};
