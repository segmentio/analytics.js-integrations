'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `EmailAptitude` integration.
 */

var EmailAptitude = (module.exports = integration('Email Aptitude')
  .assumesPageview()
  .global('_ea')
  .global('EmailAptitudeTracker')
  .option('accountId', '')
  .tag('<script src="//tracker.emailaptitude.com/ea.js">'));

/**
 * Initialize.
 *
 * @api public
 */

EmailAptitude.prototype.initialize = function() {
  window._ea = window._ea || {};
  window._ea.accountId = this.options.accountId;
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

EmailAptitude.prototype.loaded = function() {
  return !!window.EmailAptitudeTracker;
};
