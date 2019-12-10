'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var when = require('do-when');

/**
 * Expose `SatisMeter` integration.
 */

var SatisMeter = module.exports = integration('SatisMeter')
  .global('satismeter')
  .option('token', '')
  .option('apiKey', '')
  .tag('<script src="https://app.satismeter.com/satismeter.js">');

/**
 * Initialize.
 *
 * @api public
 */

SatisMeter.prototype.initialize = function() {
  var self = this;
  this.load(function() {
    when(function() { return self.loaded(); }, self.ready);
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

SatisMeter.prototype.loaded = function() {
  return !!window.satismeter;
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

SatisMeter.prototype.identify = function(identify) {
  window.satismeter({
    writeKey: this.options.apiKey || this.options.token,
    userId: identify.userId(),
    traits: this.analytics.user().traits(),
    type: 'identify'
  });
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

SatisMeter.prototype.page = function() {
  window.satismeter({
    writeKey: this.options.apiKey || this.options.token,
    userId: this.analytics.user().id(),
    type: 'page'
  });
};
