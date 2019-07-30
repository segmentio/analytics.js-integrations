'use strict';

/**
 * Module dependencies.
 */

var each = require('@ndhoule/each');
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('$CVO');

/**
 * Expose `Convertro` integration.
 */

var Convertro = (module.exports = integration('Convertro')
  .global('$CVO')
  .global('__cvo')
  .option('account', '')
  .option('hybridAttributionModel', false)
  .mapping('events')
  .tag('<script src="//d1ivexoxmp59q7.cloudfront.net/{{ account }}/live.js">'));

/**
 * Initialize.
 */

Convertro.prototype.initialize = function() {
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

Convertro.prototype.loaded = function() {
  return typeof (window.$CVO && window.$CVO.trackEvent) === 'function';
};

/**
 * Identify.
 *
 * @api public
 * @param {Facade} identify
 */

Convertro.prototype.identify = function(identify) {
  if (!identify.userId()) return;
  push('trackUser', identify.traits());
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Convertro.prototype.track = function(track) {
  var events = this.events(track.event());
  var revenue = track.revenue();
  var total = track.total();
  each(function(type) {
    push('trackEvent', {
      amount: total || revenue,
      id: track.orderId(),
      type: type
    });
  }, events);
};

/**
 * Order Completed & Attribution model
 *   - Convertro has two attribution models
 *   - the first is for when you don't know if clients are new/repeat
 *   - the second is for when you know if a client is new/repeat
 *   - The hybridAttributionModel allows users to
 *   - move between the two attribution models
 *
 *   - option=hybridAttributionModel (true)
 *   - type="sale" && "sale.new"(.repeat=false), when it's a new order.
 *   - type="sale" && "sale.repeat"(.repeat=true), when it's repeat order
 *   - type="sale" (.repeat=null), when you can't figure out if an order is repeat / new
 *
 *   - option=hybridAttributionModel (false)
 *   - type="sale.new"(.repeat=false), when it's a new order.
 *   - type="sale.repeat"(.repeat=true), when it's repeat order.
 *   - type="sale" (.repeat=null), when you can't figure out if an order is repeat / new
 *
 *
 * @api public
 * @param {Track} track
 */

Convertro.prototype.orderCompleted = function(track) {
  var repeat = track.proxy('properties.repeat');
  var amount = track.total() || track.revenue();
  var id = track.orderId();

  if (typeof repeat === 'boolean') {
    push('trackEvent', {
      id: id,
      type: repeat ? 'sale.repeat' : 'sale.new',
      amount: amount
    });
  }

  if (typeof repeat !== 'boolean' || this.options.hybridAttributionModel) {
    push('trackEvent', {
      id: id,
      type: 'sale',
      amount: amount
    });
  }
};
