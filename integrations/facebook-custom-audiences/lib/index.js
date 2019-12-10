'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_fbq');
var foldl = require('@ndhoule/foldl');
var Track = require('segmentio-facade').Track;

/**
 * Expose `FacebookCustomAudiences`.
 */

var FacebookCustomAudiences = module.exports = integration('Facebook Custom Audiences')
  .global('_fbds')
  .global('_fbq')
  .option('pixelId', '')
  .option('currency', 'USD')
  .mapping('events')
  .tag('<script src="//connect.facebook.net/en_US/fbds.js">');

/**
 * Initialize.
 *
 * @api public
 */

FacebookCustomAudiences.prototype.initialize = function() {
  var pixelId = this.options.pixelId;
  window._fbds = window._fbds || {};
  window._fbds.pixelId = pixelId;
  window._fbq = window._fbq || [];
  window._fbq.push(['track', 'PixelInitialized', {}]);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

FacebookCustomAudiences.prototype.loaded = function() {
  return !!(window._fbq && Array.prototype.push !== window._fbq.push);
};

/**
 * Track.
 *
 * https://developers.facebook.com/docs/reference/ads-api/custom-audience-website#tagapi
 *
 * @api public
 * @param {Track} track
 */

FacebookCustomAudiences.prototype.track = function(track) {
  var event = track.event();
  var properties = track.properties();

  // Track event
  window._fbq.push(['track', event, properties]);
};

/**
 * Product list viewed.
 *
 * @api private
 * @param {Track} track category
 */

FacebookCustomAudiences.prototype.productListViewed = function(track) {
  push('track', 'ViewContent', {
    content_ids: [String(track.category() || '')],
    content_type: 'product_group'
  });
};

/**
 * Product viewed.
 *
 * @api private
 * @param {Track} track
 */

FacebookCustomAudiences.prototype.productViewed = function(track) {
  push('track', 'ViewContent', {
    content_ids: [String(track.productId() || track.id() || track.sku() || '')],
    content_type: 'product',
    content_name: String(track.name()),
    content_category: String(track.category()),
    currency: String(track.currency()),
    value: Number(track.value())
  });
};

/**
 * Product added.
 *
 * @api private
 * @param {Track} track
 */

FacebookCustomAudiences.prototype.productAdded = function(track) {
  push('track', 'AddToCart', {
    content_ids: [String(track.productId() || track.id() || track.sku() || '')],
    content_type: 'product',
    content_name: String(track.name()),
    content_category: String(track.category()),
    currency: String(track.currency()),
    value: Number(track.value())
  });
};

/**
 * Order Completed.
 *
 * @api private
 * @param {Track} track
 */

FacebookCustomAudiences.prototype.orderCompleted = function(track) {
  var content_ids = foldl(function(ret, product) {
    var item = new Track({ properties: product });
    var id = item.productId() || item.id() || item.sku() || '';
    ret.push(id);
    return ret;
  }, [], track.products());

  push('track', 'Purchase', {
    content_ids: content_ids,
    content_type: 'product',
    currency: String(track.currency()),
    value: Number(track.value())
  });
};
