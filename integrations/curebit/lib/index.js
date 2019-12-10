'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var Track = require('segmentio-facade').Track;
var bind = require('component-bind');
var each = require('@ndhoule/each');
var integration = require('@segment/analytics.js-integration');
var iso = require('@segment/to-iso-string');
var push = require('global-queue')('_curebitq');
var throttle = require('throttleit');
var when = require('do-when');

/**
 * Expose `Curebit` integration.
 */

var Curebit = module.exports = integration('Curebit')
  .global('_curebitq')
  .global('curebit')
  .option('campaigns', {})
  .option('device', '')
  .option('iframeBorder', 0)
  .option('iframeHeight', '480')
  .option('iframeId', 'curebit_integration')
  .option('iframeWidth', '100%')
  .option('insertIntoId', '')
  .option('responsive', true)
  .option('server', 'https://www.curebit.com')
  .option('siteId', '')
  .option('customUrl', '')
  .tag('<script src="{{ src }}">');

/**
 * Initialize.
 *
 * @api public
 */

Curebit.prototype.initialize = function() {
  var url = this.options.customUrl || '//d2jjzw81hqbuqv.cloudfront.net/integration/curebit-1.0.min.js';

  push('init', { site_id: this.options.siteId, server: this.options.server });

  this.load({ src: url }, this.ready);

  // throttle the call to `page` since curebit needs to append an iframe
  this.page = throttle(bind(this, this.page), 250);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Curebit.prototype.loaded = function() {
  return !!window.curebit;
};

/**
 * Page.
 *
 * Call the `register_affiliate` method of the Curebit API that will load a
 * custom iframe onto the page, only if this page's path is marked as a
 * campaign.
 *
 * http://www.curebit.com/docs/affiliate/registration
 *
 * This is throttled to prevent accidentally drawing the iframe multiple times,
 * from multiple `.page()` calls. The `250` is from the curebit script.
 *
 * @api private
 * @param {String} url
 * @param {String} id
 * @param {Function} fn
 */

// FIXME: Is this deprecated? Seems unused
Curebit.prototype.injectIntoId = function(url, id, fn) {
  when(function() {
    return document.getElementById(id);
  }, function() {
    var script = document.createElement('script');
    script.src = url;
    var parent = document.getElementById(id);
    parent.appendChild(script);
    onload(script, fn);
  });
};

/**
 * Campaign tags.
 *
 * @api public
 * @param {Page} page
 */

Curebit.prototype.page = function() {
  var user = this.analytics.user();
  var campaigns = this.options.campaigns;
  var path = window.location.pathname;
  if (!campaigns[path]) return;

  var tags = (campaigns[path] || '').split(',');
  if (!tags.length) return;

  var settings = {
    responsive: this.options.responsive,
    device: this.options.device,
    campaign_tags: tags,
    iframe: {
      width: this.options.iframeWidth,
      height: this.options.iframeHeight,
      id: this.options.iframeId,
      frameborder: this.options.iframeBorder,
      container: this.options.insertIntoId
    }
  };

  var identify = new Identify({
    userId: user.id(),
    traits: user.traits()
  });

  // if we have an email, add any information about the user
  if (identify.email()) {
    settings.affiliate_member = {
      email: identify.email(),
      first_name: identify.firstName(),
      last_name: identify.lastName(),
      customer_id: identify.userId()
    };
  }

  push('register_affiliate', settings);
};

/**
 * Order completed.
 *
 * Fire the Curebit `register_purchase` with the order details and items.
 *
 * https://www.curebit.com/docs/ecommerce/custom
 *
 * @api public
 * @param {Track} track
 */

Curebit.prototype.orderCompleted = function(track) {
  var user = this.analytics.user();
  var orderId = track.orderId();
  var products = track.products();
  var props = track.properties();
  var items = [];
  var identify = new Identify({
    traits: user.traits(),
    userId: user.id()
  });

  each(function(product) {
    var track = new Track({ properties: product });
    items.push({
      product_id: track.productId() || track.id() || track.sku(),
      quantity: track.quantity(),
      image_url: product.image,
      price: track.price(),
      title: track.name(),
      url: product.url
    });
  }, products);

  push('register_purchase', {
    order_date: iso(props.date || new Date()),
    order_number: orderId,
    coupon_code: track.coupon(),
    subtotal: track.total(),
    customer_id: identify.userId(),
    first_name: identify.firstName(),
    last_name: identify.lastName(),
    email: identify.email(),
    items: items
  });
};
