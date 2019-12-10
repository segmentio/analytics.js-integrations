'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Wishpond` integration.
 */

var Wishpond = module.exports = integration('Wishpond')
  .global('Wishpond')
  .option('siteId', '')
  .option('apiKey', '')
  .tag('<script id="wishpond-tracker" src="//cdn.wishpond.net/connect.js">');

/**
 * Initialize.
 *
 * http://developers.wishpond.com/#introduction
 *
 * @api public
 */

Wishpond.prototype.initialize = function() {
  window.Wishpond = window.Wishpond || [];
  window.Wishpond.merchantId = this.options.siteId;
  window.Wishpond.writeKey = this.options.apiKey;
  /* eslint-disable */
  (function(){
    var a,b,c;
    a = function(f){return function(){window.Wishpond.push([f].concat(Array.prototype.slice.call(arguments,0)));};};
    b = ['identify', 'track'];
    for (c = 0; c < b.length; c++) {window.Wishpond[b[c]] = a(b[c]);}}
  )();
  /* eslint-enable */
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Wishpond.prototype.loaded = function() {
  return !!window.Wishpond.Logger;
};

/**
 * Identify.
 *
 * http://developers.wishpond.com/#identify
 *
 * @api public
 * @param {Identify} identify
 */

Wishpond.prototype.identify = function(identify) {
  if (!identify.userId()) return this.debug('user id required');

  window.Wishpond.Tracker.identify(identify.userId(), identify.traits({
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    firstName: 'first_name',
    lastName: 'last_name',
    phoneNumber: 'phone_number',
    leadScore: 'lead_score'
  }));
};

/**
 * Track.
 *
 * http://developers.wishpond.com/#tracking-events
 *
 * @api public
 * @param {Track} track
 */

Wishpond.prototype.track = function(track) {
  window.Wishpond.Tracker.track(track.event(), track.properties());
};
