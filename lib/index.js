
/**
 * Module dependencies.
 */

var integration = require('analytics.js-integration');
var foldl = require('foldl');
var each = require('each');

/**
 * Expose `FacebookAdsForWebsites` integration.
 */

var FacebookAdsForWebsites = module.exports = integration('Facebook Ads for Websites')
  .global('fbq')
  .option('currency', 'USD')
  .option('pixelId', '')
  .mapping('legacyConversionEvents')
  .mapping('standardEvents');
  .tag('<script src="//connect.facebook.net/en_US/fbevents.js">')

/**
 * Initialize Facebook Ads for Websites.
 *
 * @param {Facade} page
 */

FacebookAdsForWebsites.prototype.initialize = function(){
  var fbq = window.fbq = window._fbq = function() {
    fbq.callMethod
      ? fbq.callMethod.apply(fbq,arguments)
      : fbq.queue.push(arguments)
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version='2.0';
  fbq.queue=[];
  this.load(this.ready);
};

/**
 * Has the Facebook Ads for Websites library been loaded yet?
 *
 * @return {Boolean}
 */

FacebookAdsForWebsites.prototype.loaded = function(){
  return !!window.fbq.callMethod;
};

/**
 * Trigger a page view.
 *
 * @param {Facade} identify
 */

FacebookAdsForWebsites.prototype.page = function(page){
  fbq('track', 'PageView');
};

/**
 * Track an event.
 *
 * @param {Facade} track
 */

FacebookAdsForWebsites.prototype.track = function(track){
  var event = track.event();
  var properties = track.properties();
  var revenue = track.revenue() || 0;
  var self = this;

  window.fbq('trackCustom', event, properties);

  each(function(event) {
    window.fbq('track', event, {
      currency: self.options.currency,
      value: revenue.toFixed(2)
    });
  }, this.legacyConversionEvents(event));

  each(function(event) {
    window.fbq('track', event, {
      currency: self.options.currency,
      value: revenue.toFixed(2)
    });
  }, this.standardEvents(event));
};


/**
 * Viewed product category.
 *
 * @api private
 * @param {Track} track category
 */

FacebookAdsForWebsites.prototype.viewedProductCategory = function(track) {
  window.fbq('track', 'ViewContent', {
    content_ids: [String(track.category() || '')],
    content_type: 'product_group'
  });
};

/**
 * Viewed product.
 *
 * @api private
 * @param {Track} track
 */

FacebookAdsForWebsites.prototype.viewedProduct = function(track) {
  window.fbq('track', 'ViewContent', {
    content_ids: [String(track.id() || track.sku() || '')],
    content_type: 'product',
    content_name: String(track.name()),
    content_category: String(track.category()),
    currency: String(track.currency()),
    value: Number(track.value())
  });
};

/**
 * Added product.
 *
 * @api private
 * @param {Track} track
 */

FacebookAdsForWebsites.prototype.addedProduct = function(track) {
  window.fbq('track', 'AddToCart', {
    content_ids: [String(track.id() || track.sku() || '')],
    content_type: 'product',
    content_name: String(track.name()),
    content_category: String(track.category()),
    currency: String(track.currency()),
    value: Number(track.value())
  });
};

/**
 * Completed Order.
 *
 * @api private
 * @param {Track} track
 */

FacebookAdsForWebsites.prototype.completedOrder = function(track) {
  var key;
  var content_ids = foldl(function(acc, product) {
    key = product.id || product.sku;
    if (key) acc.push(key);
    return acc;
  }, [], track.products() || []);

  window.fbq('track', 'Purchase', {
    content_ids: content_ids,
    content_type: 'product',
    currency: String(track.currency()),
    value: Number(track.value())
  });
};
