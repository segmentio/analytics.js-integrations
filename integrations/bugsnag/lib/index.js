'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var isObject = require('isobject');
var extend = require('@ndhoule/extend');

/**
 * UMD ?
 */

var umd = typeof window.define === 'function' && window.define.amd;

/**
 * Source.
 */

var src = '//d2wy8f7a9ursnm.cloudfront.net/bugsnag-3.min.js';

/**
 * Expose `Bugsnag` integration.
 */

var Bugsnag = module.exports = integration('Bugsnag')
  .global('Bugsnag')
  .option('apiKey', '')
  .option('releaseStage', null)
  .tag('<script src="' + src + '">');

/**
 * Initialize.
 *
 * https://bugsnag.com/docs/notifiers/js
 *
 * @api public
 */

Bugsnag.prototype.initialize = function() {
  var self = this;

  if (umd) {
    window.require([src], function(bugsnag) {
      bugsnag.apiKey = self.options.apiKey;
      if (self.options.releaseStage) bugsnag.releaseStage = self.options.releaseStage;
      window.Bugsnag = bugsnag;
      self.ready();
    });
    return;
  }

  this.load(function() {
    window.Bugsnag.apiKey = self.options.apiKey;
    if (self.options.releaseStage) window.Bugsnag.releaseStage = self.options.releaseStage;
    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Bugsnag.prototype.loaded = function() {
  return isObject(window.Bugsnag);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Bugsnag.prototype.identify = function(identify) {
  window.Bugsnag.user = window.Bugsnag.user || {};
  extend(window.Bugsnag.user, identify.traits());
};
