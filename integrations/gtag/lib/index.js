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
  .option('GA_WEB_MEASUREMENT_ID', '')
  .option('GA_WEB_APP_MEASUREMENT_ID', '')
  .option('AW_CONVERSION_ID', '')
  .option('DC_FLOODLIGHT_ID', '')
  .option('trackAllPages', false)
  .option('trackNamedPages', true)
  .option('sendTo', [])
  .option('gaOptions', { setAllMappedProps: true })
  .tag(
    '<script src="//www.googletagmanager.com/gtag/js?id={{ accountId }}&l=gtagDataLayer">'
  ));

/**
 * Initialize.
 *
 * https://developers.google.com/gtagjs
 *
 * @api public
 */

GTAG.prototype.initialize = function() {
  var config = [];
  var that = this;
  var gaOptions = this.options.gaOptions;
  var GA_WEB_MEASUREMENT_ID = this.options.GA_WEB_MEASUREMENT_ID;
  var GA_WEB_APP_MEASUREMENT_ID = this.options.GA_WEB_APP_MEASUREMENT_ID;
  var AW_CONVERSION_ID = this.options.AW_CONVERSION_ID;
  var DC_FLOODLIGHT_ID = this.options.DC_FLOODLIGHT_ID;
  var accountId =
    GA_WEB_MEASUREMENT_ID ||
    GA_WEB_APP_MEASUREMENT_ID ||
    AW_CONVERSION_ID ||
    DC_FLOODLIGHT_ID;

  if (GA_WEB_MEASUREMENT_ID) {
    config.push(['config', GA_WEB_MEASUREMENT_ID]);
    if (gaOptions && Object.keys(gaOptions).length) {
      // set custom dimension and metrics if present
      push('config', GA_WEB_MEASUREMENT_ID, {
        custom_map: merge(gaOptions.dimensions, gaOptions.metrics)
      });
    }
  }

  if (GA_WEB_APP_MEASUREMENT_ID) {
    config.push(['config', GA_WEB_APP_MEASUREMENT_ID]);
    if (gaOptions && Object.keys(gaOptions).length) {
      // set custom dimension and metrics if present
      push('config', GA_WEB_APP_MEASUREMENT_ID, {
        custom_map: merge(gaOptions.dimensions, gaOptions.metrics)
      });
    }
  }

  if (AW_CONVERSION_ID) {
    config.push(['config', AW_CONVERSION_ID]);
  }

  if (DC_FLOODLIGHT_ID) {
    config.push(['config', DC_FLOODLIGHT_ID]);
  }

  if (accountId) {
    this.load({ accountId: accountId }, function() {
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
 * Identify.
 *
 * @api public
 * @param {Identify} event
 */

GTAG.prototype.identify = function(identify) {
  var userId = identify.userId();
  if (userId) {
    if (this.options.GA_WEB_MEASUREMENT_ID) {
      push('config', this.options.GA_WEB_MEASUREMENT_ID, {
        user_id: userId
      });
    }
    if (this.options.GA_WEB_APP_MEASUREMENT_ID) {
      push('config', this.options.GA_WEB_APP_MEASUREMENT_ID, {
        user_id: userId
      });
    }
  }
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
  if (this.options.sendTo && this.options.sendTo.length) {
    props.send_to = this.options.sendTo;
  }

  if (props.sendTo && props.sendTo.length) {
    // override the sendTo if provided event specific
    props.send_to = props.sendTo;
    delete props.sendTo;
  }
  push('event', props.event, props);
};

/**
 * Page
 *
 * @api public
 * @param {Page} page
 */

GTAG.prototype.page = function(page) {
  var options = this.options;
  var name = page.fullName();
  var gaOptions = this.options.gaOptions || {};
  if (gaOptions && Object.keys(gaOptions).length) {
    if (gaOptions.setAllMappedProps) {
      // set custom dimension and metrics if present
      // REF: https://developers.google.com/analytics/devguides/collection/gtagjs/custom-dims-mets

      var customMap = merge(gaOptions.dimensions, gaOptions.metrics);
      if (options.GA_WEB_MEASUREMENT_ID) {
        push('config', this.options.GA_WEB_MEASUREMENT_ID, {
          custom_map: customMap
        });
      }
      if (options.GA_WEB_APP_MEASUREMENT_ID) {
        push('config', this.options.GA_WEB_APP_MEASUREMENT_ID, {
          custom_map: customMap
        });
      }
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
