"use strict";

const log = require("../lib/log");
const spawn = require("../lib/spawn");
const { AJS_PRIVATE_LOCATION } = require("../constants");

function init() {
  spawn("git", [
    "clone",
    "git@github.com:segmentio/analytics.js-private.git",
    AJS_PRIVATE_LOCATION
  ]).catch(code => log.error(`git clone failed with code: ${code}`));
}

module.exports = init;
