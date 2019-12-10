'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var Track = require('segmentio-facade').Track;
var each = require('@ndhoule/each');
var integration = require('@segment/analytics.js-integration');
var qs = require('component-querystring');

/**
 * Expose `Bronto` integration.
 */

var Bronto = module.exports = integration('Bronto')
  .global('__bta')
  .option('siteId', '')
  .option('host', '')
  .tag('<script src="//p.bm23.com/bta.js">');

/**
 * Initialize.
 *
 * http://app.bronto.com/mail/help/help_view/?k=mail:home:api_tracking:tracking_data_store_js#addingjavascriptconversiontrackingtoyoursite
 * http://bronto.com/product-blog/features/using-conversion-tracking-private-domain#.Ut_Vk2T8KqB
 * http://bronto.com/product-blog/features/javascript-conversion-tracking-setup-and-reporting#.Ut_VhmT8KqB
 *
 * @api public
 */

Bronto.prototype.initialize = function() {
  var self = this;
  var params = qs.parse(window.location.search);
  if (!params._bta_tid && !params._bta_c) {
    this.debug('missing tracking URL parameters `_bta_tid` and `_bta_c`.');
  }
  this.load(function() {
    var opts = self.options;
    self.bta = new window.__bta(opts.siteId);
    if (opts.host) self.bta.setHost(opts.host);
    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Bronto.prototype.loaded = function() {
  return this.bta;
};

/**
 * Order Completed.
 *
 * The cookie is used to link the order being processed back to the delivery,
 * message, and contact which makes it a conversion.
 * Passing in just the email ensures that the order itself
 * gets linked to the contact record in Bronto even if the user
 * does not have a tracking cookie.
 *
 * @api private
 * @param {Track} track
 */

Bronto.prototype.orderCompleted = function(track) {
  var user = this.analytics.user();
  var products = track.products();
  var items = [];
  var identify = new Identify({
    userId: user.id(),
    traits: user.traits()
  });
  var email = identify.email();

  // items
  each(function(product) {
    var track = new Track({ properties: product });
    items.push({
      item_id: track.productId() || track.id() || track.sku(),
      desc: product.description || track.name(),
      quantity: track.quantity(),
      amount: track.price()
    });
  }, products);

  // add conversion
  this.bta.addOrder({
    order_id: track.orderId(),
    email: email,
    // they recommend not putting in a date because it needs to be formatted
    // correctly: YYYY-MM-DDTHH:MM:SS
    items: items
  });
};
