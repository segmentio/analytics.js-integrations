'use strict';

/**
 * Module dependencies.
 */

var each = require('component-each');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `RocketFuel`.
 */

var RocketFuel = module.exports = integration('Rocket Fuel')
  .option('accountId', '')
  .option('universalActionId', '')
  .tag('universal', '<img src="//{{ universalActionId }}p.rfihub.com/ca.gif?rb={{ accountId }}&ca={{ universalActionId }}&ra={{ cacheBuster }}&custtype={{ custType }}"/>')
  .tag('conversion', '<img src="//p.rfihub.com/ca.gif?rb={{ accountId }}&ca={{ actionId }}&ra={{ cacheBuster }}"/>')
  .tag('completed order', '<img src="//p.rfihub.com/ca.gif?rb={{ accountId }}&ca={{ actionId }}&ra={{ cacheBuster }}&transid={{ orderId }}&revenue={{ orderTotal }}&pid={{ productIds }}"/>')
  .mapping('events');

/**
 * Page load the universal pixel.
 *
 * @api public
 * @param {Page} page
 */

RocketFuel.prototype.page = function() {
  var user = this.analytics.user();
  var custType = 'new';
  if (user.id()) custType = 'existing';

  this.load('universal', {
    custType: custType,
    cacheBuster: this.cacheBuster()
  });
};

/**
 * Track conversion events.
 *
 * @param {Track} track
 */

RocketFuel.prototype.track = function(track) {
  var orderId = track.orderId();
  var total = (track.total() || 0).toFixed(2);
  var productIds = this.productIds(track.products());

  var events = this.events(track.event());
  var self = this;
  each(events, function(event) {
    if (orderId && total) {
      return self.load('completed order', {
        actionId: event,
        orderTotal: total,
        orderId: orderId,
        productIds: productIds,
        cacheBuster: self.cacheBuster()
      });
    }
    return self.load('conversion', {
      actionId: event,
      cacheBuster: self.cacheBuster()
    });
  });
};

/**
 * Join all the product IDs together for RocketFuel.
 *
 * @api private
 * @param {Object[]} products
 */

// TODO: Refactor to use pluck(products, 'id').join(,)
RocketFuel.prototype.productIds = function(products) {
  var ids = [];
  each(products, function(product) {
    ids.push(product.id);
  });
  return ids.join(',');
};

/**
 * Generate a random number for cachebusting.
 *
 * @api private
 */

RocketFuel.prototype.cacheBuster = function() {
  return Math.round(Math.random() * 99999999);
};
