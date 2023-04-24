'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_oiqq');
var loadScript = require('@segment/load-script');


/**
 * Expose `Oiq`
 */

var Oiq = module.exports = integration('OwnerIQ Pixel')
  .assumesPageview()
  .global('_oiqq')
  .option('dataGroupId','')
  .option('analyticTagId','')
  .option('dctTagId','')
  .tag('<script src="https://px.owneriq.net/stas/s/{{ dataGroupId }}.js"></script>');

/**
 * Initialize Oiq Conversion Tracking
 *
 * https://developers.oiq.com/docs/ads-for-websites/conversion-pixel-code-migration
 *
 * @api public
 */

Oiq.prototype.initialize = function() {
  var opts = this.options;
  window._oiqq = window._oiqq || [];
  push('oiq_addPageLifecycle', opts.analyticTagId);
  push('oiq_doTag');
  this.load(this.ready);
  window._oiqq.loaded = true;
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Oiq.prototype.loaded = function() {
  return !!(window._oiqq && window._oiqq.loaded);
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Oiq.prototype.page = function() {
  var opts = this.options;
  push('oiq_addPageLifecycle', opts.analyticTagId);
  push('oiq_doTag');

  loadScript('https://px.owneriq.net/stas/s/'+opts.dataGroupId+'.js');
};

/**
 * Track.
 **
 * @api public
 * @param {Track} track
 */

Oiq.prototype.orderCompleted = function(track) {
  window._oiqq = window._oiqq || [];
  var title = document && document.title || 'Default Conversion - do not edit';
  var opts = this.options;
  var total = track.total() || track.revenue() || 0;
  var tax = track.tax() || 0;
  var orderId = track.orderId();
  var products = track.products();
  var email = track.email();
  var customerId = track.username();

  if (!orderId) return;

  var totalQuantity=0;
  for (var i=0; i<products.length; i++) {
    var product=products[i];
    var index=i+1;
    push('oiq_addPageLifecycle', opts.dctTagId);
    push('oiq_addCustomKVP',['brand_'+index,product.brand]);
    push('oiq_addCustomKVP',['google_product_category_'+index,product.google_product_category]);
    push('oiq_addCustomKVP',['gtin_'+index,product.gtin]);
    push('oiq_addCustomKVP',['id_'+index,product.sku]);
    push('oiq_addCustomKVP',['price_'+index,product.price]);
    push('oiq_addCustomKVP',['product_type_'+index,product.category]);
    push('oiq_addCustomKVP',['quantity_'+index,product.quantity]);
    push('oiq_addCustomKVP',['title_'+index,product.name]);
    totalQuantity += product.quantity||0;
  }

  push('oiq_addCustomKVP',['order_id',orderId]);
  // window._oiqq.push(['oiq_addCustomKVP',['cc_type','value']]);
  push('oiq_addCustomKVP',['customer_id',customerId]);
  push('oiq_addCustomKVP',['email',email]);
  push('oiq_addCustomKVP',['total_cost_notax',total]);
  push('oiq_addCustomKVP',['total_cost_tax',total+tax]);
  push('oiq_addCustomKVP',['total_quantity',totalQuantity]);
  push('oiq_doTag');

  loadScript('https://px.owneriq.net/stas/s/'+opts.dataGroupId+'.js');
  loadScript('https://px.owneriq.net/j?pt='+opts.dataGroupId+'&s='+opts.dctTagId+'&sConvTitle='+title+'&cnv=true');
};