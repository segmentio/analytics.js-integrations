'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_gauges');

/**
 * Expose `Gauges` integration.
 */

var Gauges = module.exports = integration('Gauges')
  .assumesPageview()
  .global('_gauges')
  .option('siteId', '')
  .tag('<script id="gauges-tracker" src="//secure.gaug.es/track.js" data-site-id="{{ siteId }}">');

/**
 * Initialize Gauges.
 *
 * http://get.gaug.es/documentation/tracking/
 *
 * @api public
 */

Gauges.prototype.initialize = function() {
  window._gauges = window._gauges || [];
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Gauges.prototype.loaded = function() {
  return !!(window._gauges && window._gauges.push !== Array.prototype.push);
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Gauges.prototype.page = function() {
  push('track');
};
