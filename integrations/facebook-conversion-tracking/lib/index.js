'use strict';

/**
 * Module dependencies.
 */

var each = require('@ndhoule/each');
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_fbq');

/**
 * Expose `Facebook`
 */

var Facebook = (module.exports = integration('Facebook Conversion Tracking')
  .global('_fbq')
  .option('currency', 'USD')
  .tag('<script src="//connect.facebook.net/en_US/fbds.js">')
  .mapping('events'));

/**
 * Initialize Facebook Conversion Tracking
 *
 * https://developers.facebook.com/docs/ads-for-websites/conversion-pixel-code-migration
 *
 * @api public
 */

Facebook.prototype.initialize = function() {
  window._fbq = window._fbq || [];
  this.load(this.ready);
  window._fbq.loaded = true;
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Facebook.prototype.loaded = function() {
  return !!(window._fbq && window._fbq.loaded);
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Facebook.prototype.page = function(page) {
  this.track(page.track(page.fullName()));
};

/**
 * Track.
 *
 * https://developers.facebook.com/docs/reference/ads-api/custom-audience-website-faq/#fbpixel
 *
 * @api public
 * @param {Track} track
 */

Facebook.prototype.track = function(track) {
  var event = track.event();
  var events = this.events(event);
  var revenue = track.revenue() || 0;
  var self = this;

  each(function(event) {
    push('track', event, {
      currency: self.options.currency,
      value: revenue.toFixed(2)
    });
  }, events);
};
