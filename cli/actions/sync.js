"use strict";

const fs = require("fs-extra");
const { AJS_SETTINGS_LOCATION } = require("../constants");
const log = require("../lib/log");
const reportErr = require("../lib/report");

function defaultSetting(slug) {
  return { [slug]: {} };
}

/**
 * Reads the settings file or returns default json if one doesn't exist
 * @return {Object}
 */
async function readSettingsFileOrDefaultJSON(slug) {
  let settings = defaultSetting(slug); // by default, just add the slug
  try {
    settings = await fs.readJSON(AJS_SETTINGS_LOCATION);
  } catch (err) {
    // Ignore "file doesn't exist" errors, we'll create the file in a bit
    if (err.code === "ENOENT") return settings;
    throw err;
  }
  return settings;
}

async function updateSettingsFile(slug) {
  log.title(`Writing slug info ${AJS_SETTINGS_LOCATION}`);

  let settings = await readSettingsFileOrDefaultJSON(slug);
  settings = Object.assign({}, settings, defaultSetting(slug));

  await fs.writeJSON(AJS_SETTINGS_LOCATION, settings);

  log.verbose(JSON.stringify(settings, null, " ")); // extra stringify options for pretty printing
}

function sync({ slug }) {
  if (!slug) {
    log.error(
      "A slug is required. ex: 'ajs sync hubspot' \nRun 'ajs sync --help' for details."
    );
    process.exit(1);
  }

  updateSettingsFile(slug).catch(reportErr);
}

module.exports = sync;
