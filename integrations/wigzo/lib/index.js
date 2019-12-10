'use strict';

var integration = require('@segment/analytics.js-integration');
var reject = require('reject');
var when = require('do-when');

/**
 * Expose `Wigzo` integration
 */

var Wigzo = module.exports = integration('Wigzo')
  .global('wigzo')
  .option('orgToken', '')
  .tag('tracker', '<script src="https://app.wigzo.com/wigzo.compressed.js">');

/**
 * Initialize Wigzo
 */

Wigzo.prototype.initialize = function() {
  var orgToken = this.options.orgToken;
  var self = this;

  /* eslint-disable */
  // setup the tracker globals
  window.WigzoObject = 'wigzo';
  window.wigzo = window.wigzo || function() {
    window.wigzo.q = window.wigzo.q || [];
    window.wigzo.q.push(arguments);
  };
  window.wigzo.l = new Date().getTime();
  /* eslint-enable */

  window.wigzo.integrationSource = 'Segment';
  window.wigzo('configure', orgToken);
  
  this.load('tracker', function() {
    // make sure necessary functions and objects exist
    when(self.loaded, self.ready);
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Wigzo.prototype.loaded = function() {
  return !!window.wigzo;
};

/**
 * Product Added
 *
 * @param {Track} track
 */

Wigzo.prototype.productAdded = function(track) {
  var productId = track.productId();
  if (productId) window.wigzo.track('addtocart', productId);
};


/**
 * Wishlist Product Added to Cart
 *
 * @param {Track} track
 */

Wigzo.prototype.productAddedFromWishlistToCart = function(track) {
  var productId = track.productId();
  if (productId) window.wigzo.track('addtocart', productId);
};

/**
 * Product Removed
 *
 * @param {Track} track
 */

Wigzo.prototype.productRemoved = function(track) {
  var productId = track.productId();
  if (productId) window.wigzo.track('removedfromcart', productId);
};

/**
 * Products Searched
 *
 * @param {Track} track
 */

Wigzo.prototype.productsSearched = function(track) {
  var props = track.properties();
  if (props.query) {
    window.wigzo.track('search', props.query);
  }
};

/**
 * Product Added to Wishlist
 *
 * @param {Track} track
 */

Wigzo.prototype.productAddedToWishlist = function(track) {
  var productId = track.productId();
  if (productId) window.wigzo.track('wishlist', productId);
};


/**
 * Checkout Started
 *
 * @param {Track} track
 */

Wigzo.prototype.checkoutStarted = function(track) {
  var productList = track.products();
  var addedProductIds = [];
  for (var i = 0; i < productList.length; i++) {
    var item = productList[i];
    addedProductIds.push(item.product_id || item.productId);
  }

  if (addedProductIds.length) window.wigzo.track('checkoutstarted', addedProductIds);
};

/**
 * Completed Order
 *
 * @param {Track} track
 */

Wigzo.prototype.orderCompleted = function(track) {
  var productList = track.products();
  var addedProductIds = [];
  for (var i = 0; i < productList.length; i++) {
    var item = productList[i];
    addedProductIds.push(item.product_id || item.productId);
  }

  if (addedProductIds.length) window.wigzo.track('buy', addedProductIds);
};

/**
 * Product Review
 *
 * @param {Track} track
 */
Wigzo.prototype.productReviewed = function(track) {
  window.wigzo.track('review', track.properties());
};

/**
 * Product Clicked
 *
 * @param {Track} track
 */
Wigzo.prototype.productClicked = function(track) {
  var options = track.options(this.name);
  var traits = reject({
    productId : track.productId(),
    title: track.name(),
    price: track.currency() + ' ' + track.price(),
    category: track.category(),
    canonicalUrl: track.proxy('context.page.url'),
    /* custom props */
    image: options.imageUrl,
    description: options.description,
    language:options.language
  });
  window.wigzo.index(traits);
};

/**
 * Product Viewed
 *
 * @param {Track} track
 */
Wigzo.prototype.productViewed = function(track) {
  var options = track.options(this.name);
  var traits = reject({
    productId : track.productId(),
    title: track.name(),
    price: track.currency() + ' ' + track.price(),
    category: track.category(),
    canonicalUrl: track.proxy('context.page.url'),
    /* custom props */
    image: options.imageUrl,
    description: options.description,
    language:options.language
  });
  window.wigzo.index(traits);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Wigzo.prototype.identify = function(identify) {
  var id = identify.userId();
  if (id) window.wigzo.USER_IDENTIFIER = id;

  var traits = reject({
    email: identify.email(),
    phone: identify.phone(),
    fullName: identify.name()
  });
  window.wigzo.identify(traits);
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Wigzo.prototype.track = function(track) {
  window.wigzo.track(track.event(), track.properties());
};

/**
 * Page.
 *
 * @param {Page} page
 */

Wigzo.prototype.page = function(page) {
  var pageData = reject({
    canonicalUrl: page.url(),
    title: page.name()
  });
  window.wigzo.track('view',pageData);
};
