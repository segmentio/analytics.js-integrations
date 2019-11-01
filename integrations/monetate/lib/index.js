'use strict';

/**
 * Module dependencies.
 */

var Track = require('segmentio-facade').Track;
var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var mq = require('global-queue')('monetateQ');

/**
 * Events.
 */

var events = {
  productViewed: 'addItems',
  productAdded: 'addReviewRows',
  orderCompleted: 'addConversionRows'
};

/**
 * Expose `Monetate` integration.
 */

var Monetate = (module.exports = integration('Monetate')
  .option('retail', false)
  .option('siteId', '')
  .option('domain', '')
  .option('events', events)
  .option('sendDeviceId', false)
  .global('monetateQ'));

/**
 * Initialize.
 *
 * @api public
 */

Monetate.prototype.initialize = function() {
  if (this.options.retail) {
    this.options.events = {
      orderCompleted: 'addPurchaseRows',
      productViewed: 'addProductDetails',
      productListViewed: 'addProducts',
      productAdded: 'addCartRows'
    };
  }
  window.monetateQ = window.monetateQ || [];
  this.ready();
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */

Monetate.prototype.loaded = function() {
  return !!window.monetateQ;
};

/**
 * Page.
 *
 * TODO: monetate only allows certain page types
 * http://support.monetate.com/hc/en-us/articles/201657776-Self-Integration-Guide
 *
 * @param {Page} page
 */

Monetate.prototype.page = function(page) {
  this.push('setPageType', page.category() || page.name() || 'unknown');
};

/**
 * Product list viewed.
 *
 * @param {Track} track
 */

Monetate.prototype.productListViewed = function(track) {
  var products = track.products();
  var items = [];

  each(products, function(product) {
    var track = new Track({ properties: product });
    var p = toProducts(track);
    items.push(p);
  });

  this.push(this.options.events.productListViewed, items);
};

/**
 * Product viewed.
 *
 * @param {Track} track
 */

Monetate.prototype.productViewed = function(track) {
  var id = track.productId() || track.id();
  this.push(this.options.events.productViewed, [id]);
};

/**
 * Product added.
 *
 * @param {Track} track
 */

Monetate.prototype.productAdded = function(track) {
  this.push(this.options.events.productAdded, [toProduct(track)]);
};

/**
 * Order completed.
 *
 * @param {Track} track
 */

Monetate.prototype.orderCompleted = function(track) {
  var products = track.products();
  var orderId = track.orderId();
  var items = [];

  each(products, function(product) {
    var track = new Track({ properties: product });
    var p = toProduct(track);
    p.conversionId = orderId;
    items.push(p);
  });

  this.push(this.options.events.orderCompleted, items);
};

/**
 * Push Monetate event(s) into the global Monetate queue and send it.
 *
 * Every `call` to monetate __must__ begin with
 * "setPageType" and __end__ with "trackData" we defer
 * "trackData" call, we defer "trackData" every time we push.
 *
 * @api private
 * @param {...Array} args
 */

Monetate.prototype.push = function() {
  var self = this;
  mq.apply(null, arguments);

  if (this.options.sendDeviceId) {
    mq('deviceId', this.analytics.user().anonymousId());
  }

  if (this.tid) return;

  this.tid = setTimeout(function() {
    clearTimeout(self.tid);
    mq('trackData');
    self.tid = null;
  });
};

/**
 * Reformat a product list view into a Monetate-compatible format.
 *
 * @api private
 * @param {Track} track
 * @return {Object}
 */

function toProducts(track) {
  return {
    itemId: track.productId() || track.id(),
    sku: track.sku()
  };
}

/**
 * Reformat a product into to a Monetate-compatible format.
 *
 * @api private
 * @param {Track} track
 * @return {Object}
 */

function toProduct(track) {
  return {
    unitPrice: Number(track.price()).toFixed(2),
    quantity: track.quantity(),
    itemId: track.productId() || track.id(),
    sku: track.sku()
  };
}
