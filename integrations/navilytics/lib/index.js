'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('__nls');

/**
 * Expose `Navilytics` integration.
 */

var Navilytics = module.exports = integration('Navilytics')
  .assumesPageview()
  .global('__nls')
  .option('memberId', '')
  .option('projectId', '')
  .tag('<script src="//www.navilytics.com/nls.js?mid={{ memberId }}&pid={{ projectId }}">');

/**
 * Initialize.
 *
 * https://www.navilytics.com/member/code_settings
 *
 * @api public
 */

Navilytics.prototype.initialize = function() {
  window.__nls = window.__nls || [];
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Navilytics.prototype.loaded = function() {
  return !!(window.__nls && Array.prototype.push !== window.__nls.push);
};

/**
 * Track.
 *
 * https://www.navilytics.com/docs#tags
 *
 * @param {Track} track
 */

Navilytics.prototype.track = function(track) {
  push('tagRecording', track.event());
};
