'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `HitTail` integration.
 */

var HitTail = module.exports = integration('HitTail')
  .assumesPageview()
  .global('htk')
  .option('siteId', '')
  .tag('<script src="//{{ siteId }}.hittail.com/mlt.js">');

/**
 * Initialize.
 *
 * @api public
 */

HitTail.prototype.initialize = function() {
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

HitTail.prototype.loaded = function() {
  return isFunction(window.htk);
};

/**
 * Check if it is a function
 */

function isFunction(functionToCheck) {
  var getType = {};
  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}
