'use strict';

/*
 * Module dependencies.
 */

var each = require('@ndhoule/each');
var integration = require('@segment/analytics.js-integration');

/**
 * Define the `AdlearnOpenPlatform` integration.
 */
var AdLearnOpenPlatform = integration('AdLearn Open Platform')
  .option('retargetingPixelId', '')
  .tag(
    'retargeting',
    '<img src="https://secure.leadback.advertising.com/adcedge/lb?site=695501&betr={{ retargetingPixelId }}"/>'
  )
  .tag(
    'existingUsers',
    '<img src="https://secure.leadback.advertising.com/adcedge/lb?site=695501&srvc=1&betr={{ retargetingPixelId }}=920204[720]"/>'
  )
  .tag(
    'conversion',
    '<img src="https://secure.ace-tag.advertising.com/action/type={{ type }}/bins=1/rich=0/mnum=1516/logs=0/xsstr1={{ userId }}/xsstr2={{ productIds }}/xssale={{ total }}/xsmemid={{ orderId }}/"/>'
  )
  .mapping('events');

/**
 * Page load the retargeting pixel.
 *
 * @api public
 * @param {Page} page
 */
AdLearnOpenPlatform.prototype.page = function() {
  var user = this.analytics.user();

  this.load('retargeting');
  if (user.id()) this.load('existingUsers');
};

/**
 * Track conversion events.
 *
 * @api public
 * @param {Track} track
 */
AdLearnOpenPlatform.prototype.track = function(track) {
  var userId = this.analytics.user().id();
  var orderId = track.orderId();
  var total = track.total() && (track.total() || 0).toFixed(2);
  var productIds = this.productIds(track.products());

  var events = this.events(track.event());
  var self = this;
  each(function(event) {
    return self.load('conversion', {
      type: event,
      userId: userId || '',
      orderId: orderId || '',
      total: total || '',
      productIds: productIds || ''
    });
  }, events);
};

/**
 * Join all the product IDs together for AdLearnOpenPlatform.
 *
 * @api private
 * @param {Object[]} products
 * @return {string}
 */
AdLearnOpenPlatform.prototype.productIds = function(products) {
  // TODO(ndhoule): Refactor into pluck(products, 'id')
  var ids = [];
  each(function(product) {
    ids.push(product.id);
  }, products);
  return ids.join(',');
};

/*
 * Exports.
 */

module.exports = AdLearnOpenPlatform;
