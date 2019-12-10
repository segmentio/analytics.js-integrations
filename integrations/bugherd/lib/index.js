'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var tick = require('next-tick');

/**
 * Expose `BugHerd` integration.
 */

var BugHerd = module.exports = integration('BugHerd')
  .assumesPageview()
  .global('BugHerdConfig')
  .global('_bugHerd')
  .option('apiKey', '')
  .option('showFeedbackTab', true)
  .tag('<script src="//www.bugherd.com/sidebarv2.js?apikey={{ apiKey }}">');

/**
 * Initialize.
 *
 * http://support.bugherd.com/home
 *
 * @api public
 */

BugHerd.prototype.initialize = function() {
  window.BugHerdConfig = { feedback: { hide: !this.options.showFeedbackTab } };
  var ready = this.ready;
  this.load(function() {
    tick(ready);
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

BugHerd.prototype.loaded = function() {
  return !!window._bugHerd;
};
