'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_prum');

/**
 * Expose `Pingdom` integration.
 */

var Pingdom = module.exports = integration('Pingdom')
  .assumesPageview()
  .global('_prum')
  .global('PRUM_EPISODES')
  .option('id', '')
  .tag('<script src="//rum-static.pingdom.net/prum.min.js">');

/**
 * Initialize.
 *
 * @api public
 */

Pingdom.prototype.initialize = function() {
  window._prum = window._prum || [];
  push('id', this.options.id);
  var date = new Date();
  push('mark', 'firstbyte', date.getTime());
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Pingdom.prototype.loaded = function() {
  return !!(window._prum && window._prum.push !== Array.prototype.push);
};
