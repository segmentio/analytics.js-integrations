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
  .option('useEnhancedMatchLoad', false)
  .option('mapMessageIdToEventId', false)
  .mapping('pinterestEventMapping')
  .tag('<script src="https://s.pinimg.com/ct/core.js"></script>'));

Pinterest.prototype.initialize = function() {
  // We require a Tag ID to run this integration.
  if (!this.options.tid) return;

  // Preparation for loading the Pinterest script.
  (function(e) {
    if (!window.pintrk) {
      window.pintrk = function() {
        window.pintrk.queue.push(Array.prototype.slice.call(arguments));
      };
      var n = window.pintrk;
      (n.queue = []), (n.version = '3.0');
    }
  })(); // eslint-disable-line

  this.load(this.ready);
  var traits = this.analytics.user().traits();
  if (traits && traits.email && this.options.useEnhancedMatchLoad) {
    var email = this.analytics.user().traits().email;
    window.pintrk('load', this.options.tid, { em: email });
  } else {
    window.pintrk('load', this.options.tid);
  }
  window.pintrk('page'); // This is treated semantically different than our own page implementation.

  this.createPropertyMapping();
};

Pinterest.prototype.loaded = function() {
  return !!(window.pintrk && window.pintrk.queue);
};

Pinterest.prototype.identify = function(identify) {
  // Set the Enhanced Match email if present  in .identify() call. The 'set' method piggybacks onto events because the values you set are not useful unless they relate to one or more events.
  // Hence, after 'set' is called, nothing will appear in either the network or via the tag helper extension.
  // But when the next event is called, a hashed value for an 'em' parameter will be in a JSON object encoded in the URL, and you can also see the email box in the tag helper extension.
  if (identify.email()) {
    window.pintrk('set', { np: 'segment', em: identify.email() });
  }
};

Pinterest.prototype.page = function(page) {
  var pinterestPageProps = {
    name: page.name() || ''
  };

  var eventKeys = ['event_id', 'eid', 'eventID'];

  for (var i = 0; i < eventKeys.length; i++) {
    if (page.properties() && page.properties()[eventKeys[i]]) {
      pinterestPageProps.event_id = page.properties()[eventKeys[i]];
    }
  }

  if (this.options.mapMessageIdToEventId) {
    pinterestPageProps.event_id = page.proxy('messageId');
  }

  // If we have a category, the use ViewCategory. Otherwise, use a normal PageVisit.
  if (page.category()) {
    pinterestPageProps.category = page.category();
    window.pintrk('track', 'ViewCategory', pinterestPageProps);
  } else {
    window.pintrk('track', 'PageVisit', pinterestPageProps);
  }
};

Pinterest.prototype.track = function(track) {
  // Send a Pinterest Event if mapped. Otherwise, send the call as-is.
  var segmentEvent = track.event();
  var pinterestEvent = this.getPinterestEvent(segmentEvent);
  var pinterestObject = this.generatePropertiesObject(track);

  if (pinterestEvent) {
    window.pintrk('track', pinterestEvent, pinterestObject);
  } else {
    window.pintrk('track', segmentEvent, pinterestObject);
  }
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
    currency: 'currency',
    messageId: 'event_id'
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

  if(this.options.mapMessageIdToEventId){
    this.propertyMap.messageId = 'event_id';
  }
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

  if (this.options.mapMessageIdToEventId) {
    pinterestProps['event_id'] = track.proxy('messageId');
  }
  // Determine if there's a 'products' Array, then add in the specific features on that decision.
  var products = track.proxy('properties.products');
  var lineItemsArray;
  if (Array.isArray(products)) {
    lineItemsArray = [];
    for (var i = 0; i < products.length; i++) {
      for (var productProperty in this.productPropertyMap) {
        if (!this.productPropertyMap.hasOwnProperty(productProperty)) continue;
        trackValue = products[i][productProperty];
        if (trackValue) {
          // Product values are added into a `line_items` array, with a nested object. If that doesn't exist, make it first.
          if (lineItemsArray[i] === undefined) lineItemsArray[i] = {};
          lineItemsArray[i][
            this.productPropertyMap[productProperty]
          ] = trackValue;
        }
      }
    }
    if (lineItemsArray.length) pinterestProps.line_items = lineItemsArray;
  } else {
    // There will only be a single layer, since we have, at most, one product.
    lineItemsArray = [{}];
    var propAdded = false;
    for (var productProp in this.productPropertyMap) {
      if (!this.productPropertyMap.hasOwnProperty(productProp)) continue;
      trackValue = track.proxy('properties.' + productProp);
      if (trackValue) {
        lineItemsArray[0][this.productPropertyMap[productProp]] = trackValue;
        propAdded = true;
      }
    }
    if (propAdded) pinterestProps.line_items = lineItemsArray;
  }

  // Finally, add in any custom properties defined by the user.
  var customProps = this.options.pinterestCustomProperties;

  for (var j = 0; j < customProps.length; j++) {
    var customProperty = customProps[j];
    trackValue = track.proxy('properties.' + customProperty);
    if (trackValue) pinterestProps[customProperty] = trackValue;
  }

  return pinterestProps;
};
