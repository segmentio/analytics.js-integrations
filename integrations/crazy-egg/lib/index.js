'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `CrazyEgg` integration.
 */

var CrazyEgg = module.exports = integration('Crazy Egg')
  .assumesPageview()
  .global('CE2')
  .option('accountNumber', '')
  .tag('<script src="//script.crazyegg.com/pages/scripts/{{ path }}.js?{{ cacheBuster }}">');

/**
 * Initialize.
 *
 * @api public
 */

CrazyEgg.prototype.initialize = function() {
  var number = this.options.accountNumber;
  var path = number.slice(0, 4) + '/' + number.slice(4);
  var cacheBuster = Math.floor(new Date().getTime() / 3600000);
  this.load({ path: path, cacheBuster: cacheBuster }, this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

CrazyEgg.prototype.loaded = function() {
  return !!window.CE2;
};
