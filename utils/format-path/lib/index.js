"use strict";

const path = require("path");
module.exports = formatPath;

function formatPath(p) {
  if (p && typeof p === "string") {
    const sep = path.sep;
    if (sep === "/") {
      // mac
      return p;
    } else {
      return p.replace(/\\/g, "/");
    }
  }
  return p;
}
