'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Lou` integration.
 */

var Lou = (module.exports = integration('Lou')
  .readyOnInitialize()
  .readyOnLoad()
  .global('LOU')
  .option('organizationId', null)
  .tag(
    'lou',
    '<script src="//run.louassist.com/v2.5.1-m?id={{organizationId}}">'
  ));

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

  this.load('lou', this.ready);
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
 * Identify.
 *
 * @api public
 * @param {Facade} identify
 */

Lou.prototype.identify = function(identify) {
  window.LOU.identify(identify.userId(), identify.traits());
};

/**
 * Track.
 *
 * @param {Facade} track
 */

Lou.prototype.track = function(track) {
  window.LOU.track(track.event(), track.properties());
};
