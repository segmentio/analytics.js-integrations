'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('dataLayer', { wrap: false });

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
    '<script src="//www.googletagmanager.com/gtag/js?id={{ GA_MEASUREMENT_ID }}&l=dataLayer">'
  )
  .tag(
    'aw',
    '<script src="//www.googletagmanager.com/gtag/js?id={{ AW_CONVERSION_ID }}&l=dataLayer">'
  )
  .tag(
    'dc',
    '<script src="//www.googletagmanager.com/gtag/js?id={{ DC_FLOODLIGHT_ID }}&l=dataLayer">'
  ));

/**
 * Initialize.
 *
 * https://developers.google.com/gtagjs
 *
 * @api public
 */

GTAG.prototype.initialize = function() {
  var tagPrefix = '';
  var config = [];
  var that = this;
  if (this.options.GA_MEASUREMENT_ID) {
    tagPrefix = 'ga';
    config.push(['config', this.options.GA_MEASUREMENT_ID]);
  } else if (this.options.AW_CONVERSION_ID) {
    tagPrefix = 'aw';
    config.push(['config', this.options.AW_CONVERSION_ID]);
  } else if (this.options.DC_FLOODLIGHT_ID) {
    tagPrefix = 'dc';
    config.push(['config', this.options.DC_FLOODLIGHT_ID]);
  }
  if (tagPrefix) {
    this.load(tagPrefix, this.options, function() {
      // Default routing.
      for (var i = 0; i < config.length; i++) {
        push(config[i][0], config[i][1]);
      }
      that.ready();
    });
  } else {
    // Error case where not any of the ID specified
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
