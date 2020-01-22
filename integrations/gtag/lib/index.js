'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `GTAG`.
 */

var GTAG = (module.exports = integration('Gtag')
  .global('dataLayer')
  .option('GA_MEASUREMENT_ID', '')
  .option('AW_CONVERSION_ID', '')
  .option('DC_FLOODLIGHT_ID', '')
  .tag(
    'ga',
    '<script src="//www.googletagmanager.com/gtag/js?id={{ GA_MEASUREMENT_ID }}">'
  )
  .tag(
    'aw',
    '<script src="//www.googletagmanager.com/gtag/js?id={{ AW_CONVERSION_ID }}">'
  )
  .tag(
    'dc',
    '<script src="//www.googletagmanager.com/gtag/js?id={{ DC_FLOODLIGHT_ID }}">'
  ));

/**
 * Initialize.
 *
 * https://developers.google.com/gtagjs
 *
 * @api public
 */

GTAG.prototype.initialize = function() {
  if (this.options.GA_MEASUREMENT_ID) {
    this.load('ga', this.options, this.ready);
  } else if (this.options.AW_CONVERSION_ID) {
    this.load('aw', this.options, this.ready);
  } else if (this.options.DC_FLOODLIGHT_ID) {
    this.load('dc', this.options, this.ready);
  }
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

GTAG.prototype.loaded = function() {
  return !!(window.dataLayer && Array.prototype.push !== window.dataLayer.push);
};
