'use strict';

/**
 * Module dependencies.
 */

var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_iva');

/**
 * Expose `QuanticMind` integration.
 */

var QuanticMind = module.exports = integration('QuanticMind')
  .global('_iva')
  .option('clientId', '')
  .option('domain', '')
  .tag('<script src="//analytics.staticiv.com/iva.js">')
  .mapping('events');

/**
 * Initialize.
 *
 * @api public
 */

QuanticMind.prototype.initialize = function() {
  var domain = this.options.domain;
  window._iva = window._iva || [];
  push('setClientId', this.options.clientId);
  var userId = this.analytics.user().anonymousId();
  if (userId) push('setUserId', userId);
  if (domain) push('setDomain', domain);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

QuanticMind.prototype.loaded = function() {
  return !!(window._iva && window._iva.push !== Array.prototype.push);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

QuanticMind.prototype.identify = function(identify) {
  push('setUserId', identify.anonymousId());
};

/**
 * Page.
 *
 * @param {Page} page
 */

QuanticMind.prototype.page = function() {
  // they want every landing page to send a "click" event.
  push('trackEvent', 'click');
};

/**
 * Track.
 *
 * Tracks everything except 'sale' events.
 *
 * @param {Track} track
 */

QuanticMind.prototype.track = function(track) {
  var user = this.analytics.user();
  var events = this.events(track.event());
  var value = track.revenue() || track.value() || 0;
  var eventId = track.orderId() || user.anonymousId() || '';
  each(events, function(event) {
    // 'sale' is a special event that will be routed to a table that is deprecated on QuanticMind's end.
    // They don't want a generic 'sale' event to go to their deprecated table.
    if (event !== 'sale') {
      push('trackEvent', event, value, eventId);
    }
  });
};
