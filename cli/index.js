#!/usr/bin/env node
"use strict";

const up = require("./actions/up");
const sync = require("./actions/sync");
const init = require("./actions/init");
const yargs = require("yargs");
const log = require("./lib/log");

yargs.scriptName("ajs").demandCommand(1);

yargs
  .command("init", "clones repos and sets up local environment", init)
  .showHelpOnFail(true);

yargs
  .command(
    "sync [slug]",
    "creates a local settings file at ~/.ajs.settings.json",
    {
      slug: {
        description: "The metadata slug for an integration (ex: 'hubspot')"
      }
    },
    sync
  )
  .showHelpOnFail(true);

yargs
  .command("up", "launches a local testing website", up)
  .showHelpOnFail(true);

// In the world of yargs, `.argv` is effectively a .start()
const argv = yargs.showHelpOnFail(true).argv;
log.setup(argv);
