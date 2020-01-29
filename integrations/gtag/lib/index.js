'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('gtagDataLayer', { wrap: false });

/**
 * Expose `GTAG`.
 *  Purposely using different data-layer name to avoid conflicts
 *  with any other tool.
 */

var GTAG = (module.exports = integration('Gtag')
  .global('gtagDataLayer')
  .option('GA_MEASUREMENT_ID', '')
  .option('AW_CONVERSION_ID', '')
  .option('DC_FLOODLIGHT_ID', '')
  .tag(
    'ga',
    '<script src="//www.googletagmanager.com/gtag/js?id={{ GA_MEASUREMENT_ID }}&l=gtagDataLayer">'
  )
  .tag(
    'aw',
    '<script src="//www.googletagmanager.com/gtag/js?id={{ AW_CONVERSION_ID }}&l=gtagDataLayer">'
  )
  .tag(
    'dc',
    '<script src="//www.googletagmanager.com/gtag/js?id={{ DC_FLOODLIGHT_ID }}&l=gtagDataLayer">'
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
  }
  if (this.options.AW_CONVERSION_ID) {
    tagPrefix = 'aw';
    config.push(['config', this.options.AW_CONVERSION_ID]);
  }
  if (this.options.DC_FLOODLIGHT_ID) {
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
  return !!(
    window.gtagDataLayer && Array.prototype.push !== window.gtagDataLayer.push
  );
};

/**
 * Track
 *
 * @api public
 * @param {Track} track
 */

GTAG.prototype.track = function(track) {
  var props = track.properties();
  props.event = track.event() || '';
  push(props);
};

/**
 * Page
 *
 * @api public
 * @param {Page} page
 */

GTAG.prototype.page = function(page) {
  this.track(page.track());
};
