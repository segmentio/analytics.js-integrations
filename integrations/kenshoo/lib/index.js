'use strict';

/**
 * Module dependencies.
 */

var includes = require('@ndhoule/includes');
var integration = require('@segment/analytics.js-integration');
var is = require('is');

/**
 * Expose `Kenshoo` integration.
 */

var Kenshoo = module.exports = integration('Kenshoo')
  .global('k_trackevent')
  .option('cid', '')
  .option('events', [])
  .option('subdomain', '')
  .tag('<script src="//{{ subdomain }}.xg4ken.com/media/getpx.php?cid={{ cid }}">');

/**
 * Initialize.
 *
 * See https://gist.github.com/justinboyle/7875832
 *
 * @api public
 */

Kenshoo.prototype.initialize = function() {
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Kenshoo.prototype.loaded = function() {
  return is.fn(window.k_trackevent);
};

/**
 * Track.
 *
 * FIXME: Only tracks events if they are listed in the events array option.
 * We've asked for docs a few times but no go :/
 *
 * https://github.com/jorgegorka/the_tracker/blob/master/lib/the_tracker/trackers/kenshoo.rb
 *
 * @api public
 * @param {Track} event
 */

Kenshoo.prototype.track = function(track) {
  var events = this.options.events;
  var event = track.event();
  var revenue = track.revenue() || 0;
  if (!includes(event, events)) return;

  var params = [
    'id=' + this.options.cid,
    'type=conv',
    'val=' + revenue,
    'orderId=' + track.orderId(),
    'promoCode=' + track.coupon(),
    'valueCurrency=' + track.currency(),

    // Live tracking fields.
    // FIXME: Ignored for now (until we get documentation).
    'GCID=',
    'kw=',
    'product='
  ];

  window.k_trackevent(params, this.options.subdomain);
};
