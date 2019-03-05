'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var analyticsEvents = require('analytics-events');

/**
 * Expose `Pinterest` integration.
 */

var Pinterest = (module.exports = integration('Pinterest Tag')
  .global('pintrk')
  .option('tid', '')
  .option('pinterestCustomProperties', [])
  .mapping('pinterestEventMapping')
  .tag('<script src="https://s.pinimg.com/ct/core.js"></script>'));

Pinterest.prototype.initialize = function() {
  // We require a Tag ID to run this integration.
  if (!this.options.tid) return;

  // Preparation for loading the Pinterest script.
  (function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";}})(); // eslint-disable-line

  this.load(this.ready);
  window.pintrk('load', this.options.tid);
  window.pintrk('page'); // This is treated semantically different than our own page implementation.

  this.createPropertyMapping();
};

Pinterest.prototype.loaded = function() {
  return !!(window.pintrk && window.pintrk.queue);
};

Pinterest.prototype.identify = function(identify) {
  // If we have an email then enable Enhanced Match feature by reloading the Pinterest library.
  // TODO: We may want to add a toggle in the Pinterest integration UI as a configuration to enable enhanced match
  if (identify.email()) {
    window.pintrk('load', this.options.tid, {
      em: identify.email()
    });
  }
};

Pinterest.prototype.page = function(page) {
  // If we have a category, the use ViewCategory. Otherwise, use a normal PageVisit.
  if (page.category()) {
    window.pintrk('track', 'ViewCategory', {
      category: page.category(),
      name: page.name() || ''
    });
  } else {
    window.pintrk('track', 'PageVisit', {
      name: page.name() || ''
    });
  }
};

Pinterest.prototype.track = function(track) {
  // Send a Pinterest Event if mapped. Otherwise, send the call as-is.
  var segmentEvent = track.event();
  var pinterestEvent = this.getPinterestEvent(segmentEvent);
  var pinterestObject = this.generatePropertiesObject(track);

  pinterestEvent
    ? window.pintrk('track', pinterestEvent, pinterestObject)
    : window.pintrk('track', segmentEvent, pinterestObject);
};

Pinterest.prototype.getPinterestEvent = function(segmentEvent) {
  for (var mappedEvent in this.options.pinterestEventMapping) {
    if (mappedEvent.toLowerCase() === segmentEvent.toLowerCase()) {
      return this.options.pinterestEventMapping[mappedEvent];
    }
  }

  var eventMap = [
    // Segment Inbound Event (Regex) -> Pinterest Outbound Event
    [analyticsEvents.productsSearched, 'Search'],
    [analyticsEvents.productListFiltered, 'Search'],
    [analyticsEvents.productAdded, 'AddToCart'],
    [analyticsEvents.orderCompleted, 'Checkout'],
    [analyticsEvents.videoPlaybackStarted, 'WatchVideo']
  ];

  for (var index in eventMap) {
    if (!eventMap.hasOwnProperty(index)) continue;
    var eventRegex = eventMap[index][0];
    var pinterestEvent = eventMap[index][1];

    if (eventRegex.test(segmentEvent)) {
      return pinterestEvent;
    }
  }
};

/**
 * Generate the property mappings for the integration. Account for product information being nested in a `products` array.
 */

Pinterest.prototype.createPropertyMapping = function() {
  this.propertyMap = {
    // Segment Property: Pinterest Property
    query: 'search_query',
    order_id: 'order_id',
    coupon: 'coupon',
    value: 'value',
    currency: 'currency'
  };

  // This is a second map to allow us to loop over specific potentially-nested properties.
  this.productPropertyMap = {
    // Segment Property: Pinterest Property
    name: 'product_name',
    product_id: 'product_id',
    sku: 'product_id',
    category: 'product_category',
    variant: 'product_variant',
    price: 'product_price',
    quantity: 'product_quantity',
    brand: 'product_brand'
  };
};

/**
 * Fill our Properties for the pintrk() call.
 */

Pinterest.prototype.generatePropertiesObject = function(track) {
  // Generate the properties object to send with the call.
  var pinterestProps = {};
  var trackValue;
  for (var prop in this.propertyMap) {
    if (!this.propertyMap.hasOwnProperty(prop)) continue;
    trackValue = track.proxy('properties.' + prop);
    if (trackValue) pinterestProps[this.propertyMap[prop]] = trackValue;
  }

  // Determine if there's a 'products' Array, then add in the specific features on that decision.
  var products = track.proxy('properties.products');
  var lineItemsArray;
  if (Array.isArray(products)) {
    lineItemsArray = [];
    for (var i = 0; i < products.length; i++) {
      for (prop in this.productPropertyMap) {
        if (!this.productPropertyMap.hasOwnProperty(prop)) continue;
        trackValue = products[i][prop];
        if (trackValue) {
          // Product values are added into a `line_items` array, with a nested object. If that doesn't exist, make it first.
          if (lineItemsArray[i] === undefined) lineItemsArray[i] = {};
          lineItemsArray[i][this.productPropertyMap[prop]] = trackValue;
        }
      }
    }
    if (lineItemsArray.length) pinterestProps.line_items = lineItemsArray;
  } else {
    // There will only be a single layer, since we have, at most, one product.
    lineItemsArray = [{}];
    var propAdded = false;
    for (prop in this.productPropertyMap) {
      if (!this.productPropertyMap.hasOwnProperty(prop)) continue;
      trackValue = track.proxy('properties.' + prop);
      if (trackValue) {
        lineItemsArray[0][this.productPropertyMap[prop]] = trackValue;
        propAdded = true;
      }
    }
    if (propAdded) pinterestProps.line_items = lineItemsArray;
  }

  // Finally, add in any custom properties defined by the user.
  var customProps = this.options.pinterestCustomProperties;
  for (var j = 0; j < customProps.length; j++) {
    prop = customProps[j];
    trackValue = track.proxy('properties.' + prop);
    if (trackValue) pinterestProps[prop] = trackValue;
  }

  return pinterestProps;
};
