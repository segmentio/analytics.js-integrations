'use strict';

/**
 * Module dependencies.
 */

var Track = require('segmentio-facade').Track;
var each = require('component-each');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `ShareASale`.
 */

var ShareASale = (module.exports = integration('ShareASale')
  .option('merchantId', '')
  .option('currency', 'USD')
  .option('createLeads', false)
  .tag(
    'orderCompleted',
    '<img src="https://shareasale.com/sale.cfm?amount={{ orderTotal }}&tracking={{ orderId }}&transtype=sale&merchantID={{ merchantId }}{{ repeat }}&skulist={{ skulist }}&quantitylist={{ quantitylist }}&pricelist={{ pricelist }}&currency={{ currency }}&couponcode={{ couponcode }}">'
  )
  .tag(
    'leadCreated',
    '<img src="https://shareasale.com/sale.cfm?amount=0.00&tracking={{ userId }}&transtype=lead&merchantID={{ merchantId }}">'
  ));

/**
 * Track order completed.
 *
 * @param {Track} track
 */

ShareASale.prototype.orderCompleted = function(track) {
  var orderId = track.orderId();
  var isRepeat = track.proxy('properties.repeat');
  var subtotal = (track.subtotal() || 0).toFixed(2);
  var discount = (track.discount() || 0).toFixed(2);
  var orderTotal = (subtotal - discount).toFixed(2);
  var products = track.products();
  var currency = track.currency() || this.options.currency;
  var coupon = track.coupon() || '';
  var skus = [];
  var quantities = [];
  var prices = [];

  if (!orderId) {
    this.debug('must pass `orderId`');
    return;
  }

  if (!subtotal) {
    this.debug('must pass `subtotal`, `total`, or `revenue`');
    return;
  }

  each(products, function(product) {
    var track = new Track({ properties: product });
    skus.push(track.sku());
    quantities.push(track.quantity());
    prices.push(track.price());
  });

  var repeat = '';
  if (typeof isRepeat === 'boolean') {
    repeat = isRepeat ? '&newcustomer=0' : '&newcustomer=1';
  }

  this.load('orderCompleted', {
    orderTotal: orderTotal,
    orderId: orderId,
    skulist: skus.join(','),
    quantitylist: quantities.join(','),
    pricelist: prices.join(','),
    currency: currency,
    couponcode: coupon,
    repeat: repeat
  });
};

/**
 * Identify Leads
 *
 * @param {Facade} identify
 */

ShareASale.prototype.identify = function(identify) {
  var userId = identify.userId();
  var opts = this.options;

  // identify leads created
  if (opts.createLeads) {
    if (!userId) {
      this.debug('must pass `userId`');
      return;
    }

    this.load('leadCreated', {
      userId: userId
    });
  }
};
