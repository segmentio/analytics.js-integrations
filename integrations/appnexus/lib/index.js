'use strict';

/**
 * Module dependencies.
 */

var each = require('@ndhoule/each');
var integration = require('@segment/analytics.js-integration');
var querystring = require('component-querystring');
var useHttps = require('use-https');
var toNoCase = require('to-no-case');

/**
 * Expose `AppNexus`.
 */

var AppNexus = (module.exports = integration('AppNexus')
  .tag('http', '<script src="http://ib.adnxs.com/px?{{ vars }}">')
  .tag('https', '<script src="https://secure.adnxs.com/px?{{ vars }}">'));

/**
 * Loaded.
 *
 * @return {Boolean}
 */

AppNexus.prototype.loaded = function() {
  return true;
};

/**
 * Track.
 *
 * @param {Track} track
 */

AppNexus.prototype.track = function(track) {
  var events = [];
  if (!this.options.events || !this.options.events.length) return;

  // retrieve event mappings that match the current event
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
  each(function(event) {
    return self.conversion(track, event);
  }, events);
};

/**
 * Tracks a conversion.
 *
 * @param {Track} track
 * @param {Object} event
 */

AppNexus.prototype.conversion = function(track, event) {
  var params = event.parameters || {};
  var revenue = track.revenue() || track.total();

  var vars = {
    t: 1,
    id: event.pixelId,
    seg: event.segmentId,
    order_id: track.orderId(),
    value: (revenue || 0).toFixed(2)
  };

  each(function(value, key) {
    vars[value] = track.proxy('properties.' + key);
  }, params);

  var name = useHttps() ? 'https' : 'http';

  this.load(name, { vars: querystring.stringify(vars) });
};
