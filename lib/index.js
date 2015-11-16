
/**
 * Module dependencies.
 */

var integration = require('analytics.js-integration');
var includes = require('includes');
var foldl = require('foldl');
var each = require('each');
var fbq;

/**
 * Expose `Facebook Pixel`.
 */

var FacebookPixel = module.exports = integration('Facebook Pixel')
  .global('fbq')
  .option('pixelId', '')
  .mapping('standardEvents')
  .mapping('legacyEvents')
  .tag('<script src="//connect.facebook.net/en_US/fbevents.js">');

/**
 * Initialize Facebook Pixel.
 *
 * @param {Facade} page
 */

FacebookPixel.prototype.initialize = function(){
  fbq = window.fbq = window._fbq = function() {
    fbq.callMethod
      ? fbq.callMethod.apply(fbq, arguments)
      : fbq.queue.push(arguments)
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version='2.0';
  fbq.queue=[];
  this.load(this.ready);
  fbq('init', this.options.pixelId);
};

/**
 * Has the Facebook Pixel library been loaded yet?
 *
 * @return {Boolean}
 */

FacebookPixel.prototype.loaded = function(){
  return !!(fbq && fbq.callMethod);
};

/**
 * Trigger a page view.
 *
 * @param {Facade} identify
 */

FacebookPixel.prototype.page = function(page){
  window.fbq('track', 'PageView');
};

/**
 * Track an event.
 *
 * @param {Facade} track
 */

FacebookPixel.prototype.track = function(track){
  var event = track.event();
  var revenue = formatRevenue(track.revenue());

  var payload = foldl(function(acc, val, key) {
    if (key === 'revenue') {
      acc.value = revenue;
      return acc;
    }

    acc[key] = val;
    return acc;
  }, {}, track.properties())

  var standard = this.standardEvents(event);
  var legacy = this.legacyEvents(event);

  // non-mapped events get sent as "custom events" with full
  // tranformed payload
  if (![].concat(standard, legacy).length) {
    window.fbq('trackCustom', event, payload);
    return;
  }

  // standard conversion events, mapped to one of 9 standard events
  // send full transformed payload
  each(function(event) {
    window.fbq('track', event, payload);
  }, standard);

  // legacy conversion events — mapped to specific "pixelId"s
  // send only currency and value
  each(function(event) {
    window.fbq('track', event, {
      currency: track.currency(),
      value: revenue
    });
  }, legacy);

};


/**
 * Viewed product category.
 *
 * @api private
 * @param {Track} track category
 */

FacebookPixel.prototype.viewedProductCategory = function(track) {
  window.fbq('track', 'ViewContent', {
    content_ids: [track.category() || ''],
    content_type: 'product_group'
  });
};

/**
 * Viewed product.
 *
 * @api private
 * @param {Track} track
 */

FacebookPixel.prototype.viewedProduct = function(track) {
  window.fbq('track', 'ViewContent', {
    content_ids: [track.id() || track.sku() || ''],
    content_type: 'product',
    content_name: track.name() || '',
    content_category: track.category() || '',
    currency: track.currency(),
    value: formatRevenue(track.price())
  });
};

/**
 * Added product.
 *
 * @api private
 * @param {Track} track
 */

FacebookPixel.prototype.addedProduct = function(track) {
  window.fbq('track', 'AddToCart', {
    content_ids: [track.id() || track.sku() || ''],
    content_type: 'product',
    content_name: track.name() || '',
    content_category: track.category() || '',
    currency: track.currency(),
    value: formatRevenue(track.price())
  });
};

/**
 * Completed Order.
 *
 * @api private
 * @param {Track} track
 */

FacebookPixel.prototype.completedOrder = function(track) {
  var key;
  var content_ids = foldl(function(acc, product) {
    key = product.id || product.sku;
    if (key) acc.push(key);
    return acc;
  }, [], track.products() || []);

  var revenue = formatRevenue(track.revenue());

  window.fbq('track', 'Purchase', {
    content_ids: content_ids,
    content_type: 'product',
    currency: track.currency(),
    value: revenue
  });
};


/**
 * Get Revenue Formatted Correctly for FB.
 *
 * @api private
 * @param {Track} track
 */

function formatRevenue(revenue) {
  return Number(revenue || 0).toFixed(2);
}
