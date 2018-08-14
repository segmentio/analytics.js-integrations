"use strict";

const log = require("../lib/log");
const exec = require("../lib/exec");
const { AJS_PRIVATE_LOCATION } = require("../constants");

function init() {
  log.title(`Creating a local ajs-private at ${AJS_PRIVATE_LOCATION}`);

  exec("git", [
    "clone",
    "git@github.com:segmentio/analytics.js-private.git",
    AJS_PRIVATE_LOCATION
  ]).catch(code => log.error(`git clone existed with code: ${code}`));
}

module.exports = init;
