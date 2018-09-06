'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var Track = require('segmentio-facade').Track;
var foldl = require('@ndhoule/foldl');
var each = require('component-each');

/**
 * Expose `Steelhouse`.
 */

var Steelhouse = (module.exports = integration('Steelhouse')
  .option('advertiserId', '')
  .mapping('events')
  .tag(
    'page',
    '<script src="//dx.steelhousemedia.com/spx?dxver=4.0.0&shaid={{ advertiserId }}&tdr={{ referrer }}&plh={{ location }}&cb={{ cacheBuster }}">'
  )
  .tag(
    'conversion',
    '<script src="//dx.steelhousemedia.com/spx?conv=1&shaid={{ advertiserId }}&tdr={{ referrer }}&plh={{ location }}&cb={{ cacheBuster }}&shoid={{ orderId }}&shoamt={{ total }}&shocur={{ currency }}&shopid={{ productIds }}&shoq={{ quantities }}&shoup={{ prices }}&shpil=">'
  ));

/**
 * Page load the retargeting pixel.
 *
 * @api public
 * @param {Page} page
 */

Steelhouse.prototype.page = function(page) {
  var referrer = page.referrer() || '';
  var href = page.url() || '';

  this.load('page', {
    // following the lead of their snippet in these substring lengths
    referrer: safeEncode(referrer.substring(0, 2048)),
    location: safeEncode(href.substring(0, 2048)),
    advertiserId: this.options.advertiserId,
    cacheBuster: this.cacheBuster()
  });
};

/**
 * Track conversion events.
 *
 * @api public
 * @param {Track} track
 */

Steelhouse.prototype.track = function(track) {
  var referrer = track.proxy('context.page.referrer') || '';
  var href = track.proxy('context.page.url') || '';

  var productInfo = foldl(
    function(info, product) {
      product = new Track({ properties: product });
      info.skus.push(product.sku());
      info.quantities.push(product.quantity());
      info.prices.push(product.price());
      return info;
    },
    { skus: [], quantities: [], prices: [] },
    track.products()
  );

  var advertiserId = this.options.advertiserId;
  var events = this.events(track.event());
  var self = this;

  each(events, function() {
    self.load('conversion', {
      // following the lead of their snippet in these substring lengths
      referrer: safeEncode(referrer.substring(0, 512)),
      location: safeEncode(href.substring(0, 512)),
      quantities: productInfo.quantities.join(','),
      productIds: productInfo.skus.join(','),
      prices: productInfo.prices.join(','),
      currency: track.currency() || '',
      orderId: track.orderId() || '',
      total: track.total() || '',
      advertiserId: advertiserId,
      cacheBuster: self.cacheBuster()
    });
  });
};

/**
 * Generate a random number for cachebusting.
 *
 * @api private
 */

Steelhouse.prototype.cacheBuster = function() {
  return Math.round(Math.random() * 99999999);
};

/**
 * Safely encode string
 *
 * @api private
 */

function safeEncode(string) {
  try {
    return encodeURIComponent(string);
  } catch (e) {
    return '';
  }
}
