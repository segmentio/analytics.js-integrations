'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var is = require('is');

/**
 * Expose Cxense integration.
 */

var Cxense = (module.exports = integration('Cxense')
  .option('customerPrefix', '')
  .option('siteId', '')
  .option('persistedQueryId', '')
  .option('origin', '')
  .option('setExternalId', false)
  .tag('<script src="//cdn.cxense.com/cx.js">'));

/**
 * Initialize.
 *
 * @api public
 */

Cxense.prototype.initialize = function() {
  // put your initialization logic here
  window.cX = window.cX || {};
  window.cX.callQueue = window.cX.callQueue || [];
  window.cX.callQueue.push(['setSiteId', this.options.siteId]);
  window.cX.callQueue.push([
    'setEventAttributes',
    {
      origin: this.options.customerPrefix + '-' + this.options.origin,
      persistedQueryId: this.options.persistedQueryId
    }
  ]);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

Cxense.prototype.loaded = function() {
  return !!(window.cX && window.cX.callQueue.push !== Array.prototype.push);
};

/**
 * Page
 *
 * @api public
 */

Cxense.prototype.page = function(page) {
  var properties = page.properties();

  // These properties are sent in the subsequent page view event.
  // No need to include them as custom parameters.
  delete properties.url;
  delete properties.referrer;

  var payload = {};

  // Cxense attempts to stringify all property values.
  // Arrays of primitive data types works but Objects end up as [object Object].
  // This loop ensures they are not added to the payload.
  for (var key in properties) {
    if (properties.hasOwnProperty(key)) {
      var property = properties[key];

      if (is.object(property)) continue;

      // If the property is an array, check if any elements are objects.
      if (is.array(property) && property.some(is.object)) continue;

      // Finally, we should be able to safely add the prop to the payload.
      payload[key] = property;
    }
  }

  window.cX.callQueue.push(['setCustomParameters', payload]);

  // Add external Id if user has a userId cached from a previous identify event.
  var id = this.analytics.user().id();

  if (id && this.options.setExternalId) {
    window.cX.callQueue.push([
      'addExternalId',
      { id: id, type: this.options.customerPrefix }
    ]);
  }

  // Add lat/long info if passed in the context.
  var latitude = page.proxy('context.location.latitude');
  var longitude = page.proxy('context.location.longitude');

  if (latitude && longitude) {
    window.cX.callQueue.push(['setGeoPosition', latitude, longitude]);
  }

  window.cX.callQueue.push([
    'sendPageViewEvent',
    {
      location: page.url(),
      referrer: page.referrer(),
      useAutoRefreshCheck: false
    }
  ]);
};

/**
 * Track
 *
 * @api public
 */

Cxense.prototype.track = function(track) {
  // send event data
  var properties = track.properties();

  // Cxense requires property values be strings or numbers.
  // Need to sanitize as it will drop events if the payload has other data types.
  var payload = {};
  for (var key in properties) {
    if (properties.hasOwnProperty(key)) {
      var property = properties[key];

      // Numbers and strings are passed as they are.
      // Booleans and dates can be stringified.
      // All other data types are discarded.
      if (is.number(property) || is.string(property)) {
        payload[key] = property;
      } else if (is.bool(property) || is.date(property)) {
        payload[key] = property.toString();
      }
    }
  }
  window.cX.callQueue.push(['sendEvent', track.event(), payload]);
};
