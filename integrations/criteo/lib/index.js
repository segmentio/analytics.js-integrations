'use strict';

var objCase = require('obj-case');
var extend = require('@ndhoule/extend');
var values = require('@ndhoule/values');
var pick = require('@ndhoule/pick');
var each = require('@ndhoule/each');
var md5 = require('md5');
var isEmail = require('is-email');
var useHttps = require('use-https');
var is = require('is');

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose Criteo integration.
 */

var Criteo = (module.exports = integration('Criteo')
  .option('account', '')
  .option('homeUrl', '')
  .option('supportingUserData', {})
  .option('supportingPageData', {})
  .tag('http', '<script src="http://static.criteo.net/js/ld/ld.js">')
  .tag('https', '<script src="https://static.criteo.net/js/ld/ld.js">'));

/**
 * Initialize.
 *
 * @api public
 */

Criteo.prototype.initialize = function() {
  var account = this.options.account;

  window.criteo_q = window.criteo_q || [];
  window.criteo_q.push({ event: 'setAccount', account: account });

  var protocol = useHttps() ? 'https' : 'http';
  this.load(protocol, this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

Criteo.prototype.loaded = function() {
  // what are required properties or functions that you need available on the `window`
  // before the integration marks itself as ready?
  return !!(window.criteo_q && window.criteo_q.push !== Array.prototype.push);
};

/**
 * Page
 *
 * @api public
 */

Criteo.prototype.page = function(page) {
  var homeUrl = this.options.homeUrl;
  var pageName = (page.name() || '').toLowerCase();
  var path = page.path();
  var url = page.url();
  var event = [{ event: 'viewHome' }];
  var payload = [];
  var supportingPageData = this.options.supportingPageData;
  var properties = page.properties(this.options.supportingPageData);
  var extraData = pick(values(supportingPageData), properties);

  if (!is.empty(extraData)) {
    window.criteo_q.push(extend(extraData, { event: 'setData' }));
  }

  if (url === homeUrl || pageName === 'home' || path === '/') {
    payload = event.concat(this.setExtraData(page));
    window.criteo_q.push.apply(window.criteo_q, payload);
  }
};

Criteo.prototype.track = function(track) {
  var eventMappings = this.options.eventMappings || {};
  var event = track.event();
  var eventTypeMappings = {
    viewItem: 'productViewed',
    viewList: 'productListViewed',
    viewBasket: 'cartViewed',
    trackTransaction: 'orderCompleted'
  };
  var eventType = eventMappings[event];

  if (eventTypeMappings[eventType]) {
    return this[eventTypeMappings[eventType]](track);
  }
};

/**
 * Product Viewed
 *
 * @api public
 */

Criteo.prototype.productViewed = function(track) {
  var productId = track.productId() || '';

  // Handling this separately so that it will not break for non-string productId
  // This will also get rid of string productId with only space(s) in it.
  if (typeof productId === 'string') {
    productId = productId.trim();
  }

  if (!productId) {
    // productId is madatory
    return;
  }

  var event = [{ event: 'viewItem', item: productId }];
  var payload = [];

  payload = event.concat(this.setExtraData());

  window.criteo_q.push.apply(window.criteo_q, payload);
};

/**
 * Product List Viewed
 *
 * @api public
 */

Criteo.prototype.productListViewed = function(track) {
  var products = track.products() || [];
  var productIds = [];

  each(function(product) {
    var id = objCase.find(product, 'productId');
    if (id) productIds.push(id);
  }, products);

  var event = [{ event: 'viewList', item: productIds }];
  var payload = [];

  payload = event.concat(this.setExtraData());

  window.criteo_q.push.apply(window.criteo_q, payload);
};

/**
 * Cart Viewed
 *
 * @api public
 */

Criteo.prototype.cartViewed = function(track) {
  var products = getProductMetadata(track);
  var event = [{ event: 'viewBasket', item: products }];
  var payload = [];

  payload = event.concat(this.setExtraData());

  window.criteo_q.push.apply(window.criteo_q, payload);
};

/**
 * Order Completed
 *
 * @api public
 */

Criteo.prototype.orderCompleted = function(track) {
  var orderId = objCase.find(track.properties(), 'orderId');
  var products = getProductMetadata(track);
  var event = [
    {
      event: 'trackTransaction',
      id: orderId || '',
      item: products
    }
  ];
  var payload = [];

  payload = event.concat(this.setExtraData());

  window.criteo_q.push.apply(window.criteo_q, payload);
};

/**
 * Add extra data to each tag payload.
 * Extra data is defined as an integration setting.
 *
 */

Criteo.prototype.setExtraData = function() {
  var ret = [];
  var extraData = {};

  // Add userId if available as customer_id while email is not passed in traits.
  var userId = this.analytics.user().id();

  // Check cached traits for any that have been defined as extraData params.
  var traits = this.analytics.user().traits();

  // Criteo has a special tag for emails.
  // They also require all emails get passed as md5 hashes.
  if (traits.email) {
    ret.push({ event: 'setHashedEmail', email: md5(traits.email) });
    delete traits.email;
  } else if (userId && !isEmail(userId)) {
    // Criteo does NOT want emails passed as customer_id.
    // Also if email is specified this shouldn't be tracked
    ret.push({ event: 'setCustomerId', id: userId });
  }

  // Add supporting user data.
  var supportingUserData = this.options.supportingUserData;

  each(function(value, key) {
    var trait = objCase.find(traits, key);

    if (trait) extraData[value] = trait;
  }, supportingUserData);

  if (!is.empty(extraData)) {
    // { event: "setData", ui_membership: "free", ui_age: "30"}
    ret.push(extend(extraData, { event: 'setData' }));
  }

  return ret;
};

/**
 * Get metadata from events with products array
 *
 * @api private
 */

function getProductMetadata(track) {
  var products = track.proxy('properties.products') || [];

  products = products.map(function(product) {
    var id = objCase.find(product, 'productId') || '';
    var price = product.price || '';
    var quantity = product.quantity || '';

    return { id: id, price: price, quantity: quantity };
  });

  return products;
}
