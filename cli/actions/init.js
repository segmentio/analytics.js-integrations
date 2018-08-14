"use strict";

const { spawn } = require("child_process");
const log = require("../lib/log");
const exec = require("../lib/exec");

async function init() {
  log.title("Cloning into ajs-private");

  await exec("git", [
    "clone",
    "git@github.com:segmentio/analytics.js-private.git"
  ]);
}

module.exports = init;
