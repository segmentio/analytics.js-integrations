'use strict';

/**
 * Module dependencies.
 */

var push = require('global-queue')('_qevents', { wrap: false });
var integration = require('@segment/analytics.js-integration');
var useHttps = require('use-https');
var is = require('is');
var objCase = require('obj-case');

/**
 * Expose `Quantcast` integration.
 */

var Quantcast = module.exports = integration('Quantcast')
  .assumesPageview()
  .global('_qevents')
  .global('__qc')
  .option('pCode', null)
  .option('advertise', false)
  .tag('http', '<script src="http://edge.quantserve.com/quant.js">')
  .tag('https', '<script src="https://secure.quantserve.com/quant.js">');

/**
 * Initialize.
 *
 * https://www.quantcast.com/learning-center/guides/using-the-quantcast-asynchronous-tag/
 * https://www.quantcast.com/help/cross-platform-audience-measurement-guide/
 *
 * @api public
 * @param {Page} page
 */

Quantcast.prototype.initialize = function(page) {
  window._qevents = window._qevents || [];

  var opts = this.options;
  var settings = { qacct: opts.pCode };
  var user = this.analytics.user();
  if (user.id()) settings.uid = user.id().toString();

  if (page) {
    settings.labels = this._labels(page);
  }

  push(settings);

  var name = useHttps() ? 'https' : 'http';
  this.load(name, this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Quantcast.prototype.loaded = function() {
  return !!window.__qc;
};

/**
 * Page.
 *
 * https://cloudup.com/cBRRFAfq6mf
 *
 * @api public
 * @param {Page} page
 */

Quantcast.prototype.page = function(page) {
  var settings = {
    event: 'refresh',
    labels: this._labels(page),
    qacct: this.options.pCode
  };
  var user = this.analytics.user();

  // For non-advertisers, blank labels are okay if no name/category is passed
  if (!this.options.advertise && !page.name() && !page.category()) delete settings.labels;
  if (user.id()) settings.uid = user.id().toString();
  push(settings);
};

/**
 * Identify.
 *
 * https://www.quantcast.com/help/cross-platform-audience-measurement-guide/
 *
 * @api public
 * @param {string} [id]
 */

Quantcast.prototype.identify = function(identify) {
  if (identify.userId()) {
    window._qevents[0] = window._qevents[0] || {};
    window._qevents[0].uid = identify.userId().toString();
  }
};

/**
 * Track.
 *
 * https://cloudup.com/cBRRFAfq6mf
 *
 * @api public
 * @param {Track} track
 */

Quantcast.prototype.track = function(track) {
  var revenue = track.revenue();
  var orderId = track.orderId();
  var user = this.analytics.user();
  var settings = {
    event: 'click',
    labels: this._labels(track),
    qacct: this.options.pCode
  };

  if (revenue) settings.revenue = String(revenue);
  if (orderId) settings.orderid = String(orderId);
  if (user.id()) settings.uid = user.id().toString();

  push(settings);
};

/**
 * A map of product attributes to quantcast labels.
 *
 * @type {Object}
 */

var productLabelMap = {
  brand: 'Brand',
  category: 'Category',
  coupon: 'Coupon',
  image_url: 'ImageURL',
  name: 'Name',
  position: 'Position',
  product_id: 'ProductID',
  sku: 'SKU',
  url: 'URL',
  variant: 'Variant'

  // the following spec-ed properties are not being included as labels at the
  // request of the Quantcast team:
  //  - price
  //  - quantity
};

/**
 * Order Completed
 *
 * @api private
 * @param {Track} track
 */

Quantcast.prototype.orderCompleted = function(track) {
  var labels = this._labels(track);

  if (this.options.advertise) {
    var category = safe(track.category());
    if (category) labels += ',_fp.pcat.' + category;

    var repeat = track.proxy('properties.repeat');
    if (typeof repeat === 'boolean') labels += ',_fp.customer.' + (repeat ? 'repeat' : 'new');

    if (this.options.advertiseProducts) {
      var products = track.products();

      products.forEach(function(product) {
        // only include products with an ID (as required by the spec)
        if (!objCase.find(product, 'product_id')) return;

        Object.keys(productLabelMap).forEach(function(key) {
          var value = objCase.find(product, key);
          var label = productLabelMap[key];
          if (value) labels += ',_fp.pcat.' + label + '.' + value;
        });
      });

      // Here, we are extracting a single quantity for all products in the event.
      // This doesn't make a whole lot of sense to me, but the Quantcast team
      // requested this change.
      var quantity = products.reduce(function(acc, product) {
        var quantity = objCase.find(product, 'quantity');
        if (typeof quantity === 'number') return acc + quantity;
        if (typeof quantity === 'string') return acc + parseInt(quantity, 10);
        return acc;
      }, 0);
      if (quantity > 0) labels += ',_fp.pcat.Quantity.' + quantity;
    }
  }

  var settings = {
    // the example Quantcast sent has completed order send refresh not click
    event: 'refresh',
    labels: labels,
    revenue: String(track.total() || track.revenue()),
    orderid: String(track.orderId()),
    qacct: this.options.pCode
  };

  push(settings);
};

/**
 * Generate quantcast labels.
 *
 * @api private
 * @param {Object} facade
 * @return {string}
 *
 * @example:
 *
 *    options.advertise = false;
 *    labels(track);
 *    // => "my event"
 *    labels(page);
 *    // => "Category.Name"
 *
 *    options.advertise = true;
 *    labels(track);
 *    // => "_fp.event.my event"
 *    labels(page);
 *    // => "_fp.event.Category.Name"
 *
 *  Return a string comprised of:
 *
 *  1) Prefix
 *  2) Default Labels (dot delimited)
 *     - page calls: (Category).(Name || 'Default')
 *     - track calls: (Event Name)
 *  3) Custom Labels (comma delimited)
 *     - [properties.label, ...context.Quantcast.Labels]
 */

Quantcast.prototype._labels = function(facade) {
  var action = facade.action();
  var autoLabels = [];
  var ret;

  if (action === 'page') {
    // There is no default for category
    if (facade.category()) autoLabels.push(safe(facade.category()));
    // Fallback on default label if no page name is given
    autoLabels.push(safe(facade.name() || 'Default'));
    autoLabels = autoLabels.join('.');
  } else if (action === 'track') {
    autoLabels = safe(facade.event());
  }

  var label = safe(facade.proxy('properties.label'));
  var customLabels = facade.options('Quantcast').labels || [];

  if (is.string(customLabels)) customLabels = [customLabels];

  customLabels = customLabels.map(function(label) {
    // strip special characters to prevent invalid labels
    return safe(label);
  });

  if (is.string(label)) customLabels.unshift(label);
  // Multiple labels need to be delimited by commas
  customLabels = customLabels.join(',');

  // Non-advertisers require no prefix
  if (this.options.advertise) {
    ret = '_fp.event.' + autoLabels;
  } else {
    ret = autoLabels;
  }

  if (customLabels) ret += ',' + customLabels;
  return ret;
};

/**
 * Remove special characters so that user can't accidentally mis-delimit labels or create invalid labels
 */

function safe(str) {
  if (str) return str.replace(/[^\w\s]|_/gi, '');
}
