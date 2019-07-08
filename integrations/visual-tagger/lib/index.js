'use strict';

/**
 * Module dependencies.
 */
// var TracktorLib = require('@segment/tracktor');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Tracktor` integration.
 */

var Tracktor = (module.exports = integration('Tracktor').global('tracktor'));

/**
 * Initialize.
 *
 * @api public
 */

Tracktor.prototype.initialize = function() {};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Tracktor.prototype.loaded = function() {
  return true;
};
