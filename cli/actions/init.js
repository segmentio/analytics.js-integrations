"use strict";

const log = require("../lib/log");
const exec = require("../lib/exec");
const { AJS_PRIVATE_LOCATION } = require("../constants");

function init() {
  exec(
    `git clone git@github.com:segmentio/analytics.js-private.git ${AJS_PRIVATE_LOCATION}`
  ).catch(err => log.error(err));
}

module.exports = init;
