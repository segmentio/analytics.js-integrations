'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var is = require('is');
var defaults = require('@ndhoule/defaults');

/**
 * Expose `TrackJS`.
 */

var TrackJS = (module.exports = integration('Track JS')
  .global('track')
  .global('trackJs')
  .global('_trackJs')
  .option('enabled', true)
  .option('token', '')
  .option('application', '')
  .option('callbackEnabled', true)
  .option('callbackBindStack', false)
  .option('consoleEnabled', true)
  .option('consoleDisplay', true)
  .option('consoleError', true)
  .option('networkEnabled', true)
  .option('networkError', true)
  .option('visitorEnabled', true)
  .option('windowEnabled', true)
  .tag(
    '<script src="//d2zah9y47r7bi2.cloudfront.net/releases/current/tracker.js">'
  ));

/**
 * Initialize.
 *
 * @api private
 */

TrackJS.prototype.initialize = function() {
  var opts = setOpts(this.options);
  var user = this.analytics.user();
  opts.userId = user.id() || '';
  window._trackJs = window._trackJs || {};
  window._trackJs = defaults(window._trackJs, opts);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @return {Boolean}
 * @api private
 */

TrackJS.prototype.loaded = function() {
  return is.object(window.trackJs);
};

/**
 * Reconstruct trackjs configuration object from options
 *
 * @opts Object
 */

function setOpts(opts) {
  return {
    enabled: opts.enabled,
    token: opts.token,
    application: opts.application,
    callback: {
      enabled: opts.callbackEnabled,
      bindStack: opts.callbackBindStack
    },
    console: {
      enabled: opts.consoleEnabled,
      display: opts.consoleDisplay,
      error: opts.consoleError,
      watch: ['log', 'debug', 'info', 'warn', 'error']
    },
    network: {
      enabled: opts.networkEnabled,
      error: opts.networkError
    },
    visitor: {
      enabled: opts.visitorEnabled
    },
    window: {
      enabled: opts.windowEnabled
    }
  };
}
