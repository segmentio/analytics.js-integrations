'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var toNoCase = require('to-no-case');

/**
 * Expose `Yellowhammer`.
 */

var Yellowhammer = (module.exports = integration('Yellowhammer')
  .option('segmentId', '')
  /* eslint-disable */
  .tag(
    'omnitarget',
    '<iframe src="https://jump.omnitarget.com/{{ omnitargetId }}?customer_id={{ customerId }}&order_revenue={{ orderRevenue }}&order_id={{ orderId }}" scrolling="no" frameborder="0" width="1" height="1">'
  )
  .tag(
    'adnexusConversion',
    '<script src="https://secure.adnxs.com/px?id={{ pixelId }}&value={{ revenue }}&t=1">'
  )
  .tag(
    'adnexusExclude',
    '<script src="https://secure.adnxs.com/seg?add={{ segmentId }}&t=1">'
  ));
/* eslint-enable */

/**
 * Initialize.
 */

Yellowhammer.prototype.initialize = function() {
  this.ready();
};

/**
 * Page.
 */

Yellowhammer.prototype.page = function() {
  this.load('adnexusExclude', { segmentId: this.options.segmentId });
};

/**
 * Track.
 *
 * @param {Track} track
 */

Yellowhammer.prototype.track = function(track) {
  var events = [];
  if (!this.options.events || !this.options.events.length) return;

  for (var i = 0; i < this.options.events.length; i++) {
    var item = this.options.events[i];
    if (item.value) {
      if (toNoCase(item.key) === toNoCase(track.event()))
        events.push(item.value);
    } else if (toNoCase(item.event) === toNoCase(track.event())) {
      events.push(item);
    }
  }
  var self = this;

  events.forEach(function(event) {
    var user = self.analytics.user();
    var userId = user.id() || user.anonymousId();
    var revenue = (track.revenue() || 0).toFixed(2);
    var orderId = track.orderId();

    self.load('omnitarget', {
      omnitargetId: event.omnitargetId,
      customerId: userId,
      orderRevenue: revenue,
      orderId: orderId
    });
    self.load('adnexusConversion', {
      pixelId: event.pixelId,
      revenue: revenue
    });
  });
};
