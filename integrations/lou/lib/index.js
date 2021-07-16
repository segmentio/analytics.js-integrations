'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var load = require('@segment/load-script');

/**
 * Expose `Lou` integration.
 */

var Lou = (module.exports = integration('Lou')
  .readyOnInitialize()
  .readyOnLoad()
  .global('LOU')
  .option('organizationId', null));

/**
 * Initialize.
 *
 * @api public
 */

Lou.prototype.initialize = function() {
  var LOU = {
    identify: function() {},
    track: function() {}
  };
  window.LOU = window.LOU || LOU;
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Lou.prototype.loaded = function() {
  return !!window.LOU;
};

/**
 * Load the Lou library.
 *
 * @api private
 * @param {Function} callback
 */

Lou.prototype.load = function(callback) {
  var id = this.options.organizationId;

  if (id) {
    load('//run.louassist.com/v2.5.1-m?id=' + id, callback);
  } else {
    callback();
  }
};

/**
 * Identify.
 *
 * @api public
 * @param {Facade} identify
 */

Lou.prototype.identify = function(identify) {
  var traits = identify.traits();
  delete traits.id;

  window.LOU.identify(identify.userId(), traits);
};

/**
 * Track.
 *
 * @param {Facade} track
 */

Lou.prototype.track = function(track) {
  window.LOU.track(track.event(), track.properties());
};
