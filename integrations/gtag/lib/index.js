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
  .option('trackAllPages', false)
  .option('trackNamedPages', true)
  .option('gaOptions', {})
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
  var gaOptions = this.options.gaOptions;

  if (this.options.GA_MEASUREMENT_ID) {
    tagPrefix = 'ga';
    config.push(['config', this.options.GA_MEASUREMENT_ID]);
    if (gaOptions && Object.keys(gaOptions).length) {
      // set custom dimension and metrics if present
      push('config', this.options.GA_MEASUREMENT_ID, {
        custom_map: merge(gaOptions.dimensions, gaOptions.metrics)
      });
    }
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
  push('event', props.event, props);
};

/**
 * Page
 *
 * @api public
 * @param {Page} page
 */

GTAG.prototype.page = function(page) {
  var name = page.fullName();
  var gaOptions = this.options.gaOptions || {};
  if (gaOptions && Object.keys(gaOptions).length) {
    if (this.options.GA_MEASUREMENT_ID) {
      // set custom dimension and metrics if present
      push('config', this.options.GA_MEASUREMENT_ID, {
        custom_map: merge(gaOptions.dimensions, gaOptions.metrics)
      });
    }
  }
  if (this.options.trackAllPages) {
    this.track(page.track());
  }
  if (name && this.options.trackNamedPages) {
    this.track(page.track(name));
  }
};

/**
 * Merge two javascript objects. This works similarly to `Object.assign({}, obj1, obj2)`
 * but it's compatible with old browsers. The properties of the first argument takes preference
 * over the other.
 *
 * It does not do fancy stuff, just use it with top level properties.
 *
 * @param {Object} obj1 Object 1
 * @param {Object} obj2 Object 2
 *
 * @return {Object} a new object with all the properties of obj1 and the remainder of obj2.
 */
function merge(obj1, obj2) {
  var res = {};

  // All properties of obj1
  for (var propObj1 in obj1) {
    if (obj1.hasOwnProperty(propObj1)) {
      res[propObj1] = obj1[propObj1];
    }
  }

  // Extra properties of obj2
  for (var propObj2 in obj2) {
    if (obj2.hasOwnProperty(propObj2) && !res.hasOwnProperty(propObj2)) {
      res[propObj2] = obj2[propObj2];
    }
  }

  return res;
}

// Exposed only for testing
GTAG.merge = merge;
