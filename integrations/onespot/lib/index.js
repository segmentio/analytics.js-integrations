'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `RocketFuel`.
 */

var OneSpot = (module.exports = integration('OneSpot')
  .option('accountId', '')
  .tag(
    '<script src="//d3xl0zyjyljwa.cloudfront.net/px/t/os-{{ accountId }}-0.js"></script>'
  ));

/**
 * Loaded.
 *
 * @return {Boolean}
 */

OneSpot.prototype.loaded = function() {
  return !!window.osANSegCode;
};

/**
 * Initialize.
 *
 * @api public
 */

OneSpot.prototype.initialize = function() {
  this.load({ accountId: this.options.accountId }, this.ready);
};
