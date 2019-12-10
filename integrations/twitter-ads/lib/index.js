'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var defaults = require('@ndhoule/defaults');
var foldl = require('@ndhoule/foldl');
var each = require('component-each');
var get = require('obj-case');
var Track = require('segmentio-facade').Track;
var extend = require('@ndhoule/extend');

/**
 * Expose `TwitterAds`.
 */

var TwitterAds = module.exports = integration('Twitter Ads')
  .option('page', '')
  .option('universalTagPixelId', '')
  .option('identifier', 'productId')
  .tag('singleTag', '<img src="//analytics.twitter.com/i/adsct?txn_id={{ pixelId }}&p_id=Twitter&tw_sale_amount={{ revenue }}&tw_order_quantity={{ quantity }}"/>')
  .tag('universalTag', '<script src="//static.ads-twitter.com/uwt.js">')
  .mapping('events');

/**
 * Initialize.
 *
 * @api public
 */

TwitterAds.prototype.initialize = function() {
  var self = this;

  // load universal website tag
  if (this.options.universalTagPixelId) {
    /* eslint-disable */
    (function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
},s.version='1.1',s.queue=[])})(window,document,'script');
    /* eslint-disable */

    this.load('universalTag', function() {
      window.twq('init', self.options.universalTagPixelId);
      self.ready();
    });
  } else {
    this.ready();
  }
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

TwitterAds.prototype.page = function(page) {
  if (this.options.universalTagPixelId) {
    window.twq('track', 'PageView');
  }
  if (this.options.page) {
    this.load('singleTag', {
      pixelId: this.options.page,
      revenue: 0, // default
      quantity: 0 // default
    });
  }
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

TwitterAds.prototype.track = function(track) {
  this.fireLegacyConversionTags(track);
};

/**
 * Products Searched
 *
 * Required params: None
 *
 * @api public
 * @param {Track} track
 */

TwitterAds.prototype.productsSearched = function(track) {
  this.fireLegacyConversionTags(track);

  if (this.options.universalTagPixelId) {
    var payload = setStatus(track.properties());
    window.twq('track', 'Search', payload);
  }
};

/**
 * Product Viewed
 *
 * Required params: `content_ids`, `content_type`
 *
 * @api public
 * @param {Track} product
 */

TwitterAds.prototype.productViewed = function(product) {
  this.fireLegacyConversionTags(product);

  if (this.options.universalTagPixelId) {
    var props = product.properties();
    var identifier = this.options.identifier; // sku or productId
    var payload = {
      content_ids: [product[identifier]()],
      content_type: 'product', // Must be hardcoded
      content_name: product.name(),
      content_category: product.category()
    };

    payload = extend(payload, setStatus(props));

    window.twq('track', 'ViewContent', payload);
  }
};

/**
 * Product Added
 *
 * Required params: `content_ids`, `content_type`
 *
 * @api public
 * @param {Track} product
 */

TwitterAds.prototype.productAdded = function(product) {
  this.fireLegacyConversionTags(product);

  if (this.options.universalTagPixelId) {
    var props = product.properties();
    var identifier = this.options.identifier; // sku or productId
    var payload = {
      content_ids: [product[identifier]()],
      content_type: 'product', // Must be hardcoded
      content_name: product.name()
    };

    payload = extend(payload, setStatus(props));

    window.twq('track', 'AddToCart', payload);
  }
};

/**
 * Order Completed.
 *
 * Required params: `value`, `currency`, `content_type`, `content_ids`
 *
 * @api public
 * @param {Track} track
 */

TwitterAds.prototype.orderCompleted = function(track) {
  var identifier = this.options.identifier; // 'sku' or 'productId'
  // add up all the quantities of each product
  var sumOfQuantities = foldl(function(cartQuantity, product) {
    return cartQuantity + (get(product, 'quantity') || 0);
  }, 0, track.products());

  this.fireLegacyConversionTags(track, { quantity: sumOfQuantities });

  // Advanced Conversion Tracking
  // If you do not predefine these events, Twitter still collects them but you won't be able to
  // attribute this event inside your running campaigns
  if (this.options.universalTagPixelId) {
    var payload = {
      currency: track.currency(), // Defaults to 'USD'
      content_type: 'product', // Must be hardcoded
      order_id: track.orderId(),
      num_items: sumOfQuantities.toString() // Twitter requires string value
    };

    if (track.revenue()) payload.value = track.revenue().toFixed(2);

    payload = extend(payload, setStatus(track.properties()));

    // Content Ids and Name needs some data massaging
    var content = foldl(function(ret, item) {
      var product = new Track({ properties: item });
      var contentId = product[identifier]();
      ret.ids.push(contentId);
      ret.names.push(product.name());

      return ret;
    }, { ids: [], names: [] }, track.products());

    // Sorting for browser consistency
    payload.content_ids = content.ids.sort();
    payload.content_name = content.names.sort().join(', '); // Twitter confirmed this is the recommended way to send multiple product names

    window.twq('track', 'Purchase', payload);
  }
};

/**
 * Product Added To Wishlist
 *
 * Required params: None
 *
 * @api public
 * @param {Track} product
 */

TwitterAds.prototype.productAddedToWishlist = function(product) {
  this.fireLegacyConversionTags(product);

  if (this.options.universalTagPixelId) {
    var props = product.properties();
    var identifier = this.options.identifier; // sku or productId
    var payload = {
      content_name: product.name(),
      content_category: product.category(),
      content_ids: [product[identifier]()]
    };

    payload = extend(payload, setStatus(props));

    window.twq('track', 'AddToWishlist', payload);
  }
};

/**
 * Checkout Started
 *
 * Required params: None
 *
 * @api public
 * @param {Track} track
 */

TwitterAds.prototype.checkoutStarted = function(track) {
  // add up all the quantities of each product
  var sumOfQuantities = foldl(function(cartQuantity, product) {
    return cartQuantity + (get(product, 'quantity') || 0);
  }, 0, track.products());

  this.fireLegacyConversionTags(track, { quantity: sumOfQuantities });

  if (this.options.universalTagPixelId) {
    var identifier = this.options.identifier; // sku or productId

    // Content Ids and Name needs some data massaging
    var content = foldl(function(ret, item) {
      var product = new Track({ properties: item });
      var contentId = product[identifier]();
      ret.ids.push(contentId);
      ret.names.push(product.name());
      ret.categories.push(product.category());

      return ret;
    }, { ids: [], names: [], categories: [] }, track.products());

    // Sorting for browser consistency
    var payload = {
      content_ids: content.ids.sort(),
      content_name: content.names.sort().join(', '), // Twitter confirmed this is the recommended way to send multiple product names
      content_category: content.categories.join(', ')
    };

    payload = extend(payload, setStatus(track.properties()));

    window.twq('track', 'InitiateCheckout', payload);
  }
};

/**
 * Payment Info Entered
 *
 * Required params: None
 *
 * @api public
 * @param {Track} track
 */

TwitterAds.prototype.paymentInfoEntered = function(track) {
  this.fireLegacyConversionTags(track);

  var payload = extend({}, setStatus(track.properties()));

  if (this.options.universalTagPixelId) window.twq('track', 'AddPaymentInfo', payload);
};

/**
 * Track Legacy Conversion Tags
 *
 * @api private
 * @param {Object} track
 * @param {Object} override
 */

TwitterAds.prototype.fireLegacyConversionTags = function(track, override) {
  // Only fire events that are mapped in settings
  var events = this.events(track.event());
  var self = this;

  // Fire conversion tag(s) for each mapped event
  each(events, function(pixelId) {
    var tagParams= {
      pixelId: pixelId,
      quantity: track.proxy('properties.quantity') || 0,
      revenue: track.revenue() || 0
    };

    // Allow for overriding default tag params mapping
    if (override) tagParams = defaults(override, tagParams);

    self.load('singleTag', tagParams);
  });
}

/**
 * Set status
 *
 * @api private
 * @param {Object} properties
 * @return {Object} ret
 */

function setStatus(properties) {
  return properties.status ? { status: properties.status } : {};
}
