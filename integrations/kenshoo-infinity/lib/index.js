'use strict';

/**
 * Module Dependencies
 */

var integration = require('@segment/analytics.js-integration');
var reject = require('reject');
var each = require('@ndhoule/each');
var remove = require('obj-case').del;
var extend = require('@ndhoule/extend');
var keys = require('@ndhoule/keys');
var trample = require('@segment/trample');

/**
 * Expose `Kenshoo Infinity` integration.
 */

var KenshooInfinity = (module.exports = integration('Kenshoo Infinity')
  .option('subdomain', '')
  .option('cid', '')
  .mapping('events')
  .tag(
    '<script src="https://services.xg4ken.com/js/kenshoo.js?cid={{ cid }}">'
  ));

/**
 * Initialize Kenshoo Infinity
 */

KenshooInfinity.prototype.initialize = function() {
  this.load({ cid: this.options.cid }, this.ready);
};

/**
 * Has the Kenshoo Infinity library been loaded yet?
 * @return {Boolean}
 */

KenshooInfinity.prototype.loaded = function() {
  return !!(window.kenshoo && window.kenshoo.trackConversion);
};

/**
 * Track
 * Fire Kenshoo Inifity Tags per Segment event
 * https://www.dropbox.com/s/u5iuf0m0ty2bnbx/Kenshoo%20-%20Infinity%20Tag%20-%20Implementation%20Guide.pdf?dl=0
 * https://paper.dropbox.com/doc/Kenshoo-Infinity-Tag-A.js-Spec-tRjoYxHNnF8QoCVsD6FN3
 * @param {Facade} track
 * @api public
 */

KenshooInfinity.prototype.track = function(track) {
  var conversionType = this.events(track.event()); // returns an array
  if (!conversionType.length) return;

  var subdomain = this.options.subdomain;
  var cid = this.options.cid;
  var revenue = track.revenue() || '0';
  var orderId = track.orderId();
  var promoCode = track.options(this.name).promoCode;
  var currency = track.currency();

  // Get custom properties only after removing semantic properties
  var customProperties = track.properties();
  remove(customProperties, 'conversionType');
  remove(customProperties, 'revenue');
  remove(customProperties, 'currency');
  remove(customProperties, 'orderId');
  remove(customProperties, 'promoCode');
  // flatten all compound objects with underscores and then format
  customProperties = format(trample(customProperties, { delimiter: '_' }));

  var params = reject({
    conversionType: limitChars(conversionType, 100) || 'conv',
    revenue: revenue,
    currency: currency, // defaults to 'USD'
    orderId: limitChars(orderId, 64),
    promoCode: limitChars(promoCode, 1024)
  });

  params = extend(params, customProperties);
  // All string values must be encoded
  var encodedParams = {};
  each(function(value, key) {
    encodedParams[key] = encodeURIComponent(value);
  }, params);

  window.kenshoo.trackConversion(subdomain, cid, encodedParams);
};

/**
 * Char Limit
 *
 * @param {String} string
 * @param {Number} limit
 * @return {String} ret
 * @api private
 */

function limitChars(string, limit) {
  if (!string) return string;
  // In case it is a number
  var ret = string.toString();
  return ret.substring(0, limit);
}

/**
 * Format Custom Properties
 *
 * @param {Object} properties
 * @return {Object} ret
 * @api private
 */

function format(properties) {
  var ret = {};
  // Sort keys alphabetically and take the first 15
  var sortedKeys = keys(properties)
    .sort()
    .slice(0, 15);
  each(function(key) {
    // Replace all whitespace with underscores
    var formattedKey = key.replace(/\s/g, '_');
    // Remove all non-alphnumeric/underscores
    formattedKey = formattedKey.replace(/\W/g, '');
    formattedKey = limitChars(formattedKey, 100);
    ret[formattedKey] = limitChars(properties[key], 1024);
  }, sortedKeys);

  return ret;
}
