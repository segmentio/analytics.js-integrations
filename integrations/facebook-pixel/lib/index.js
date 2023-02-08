'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var each = require('@ndhoule/each');
var reject = require('reject');
var camel = require('to-camel-case');
var is = require('is');
var dateformat = require('dateformat');
var Track = require('segmentio-facade').Track;
var sha256 = require('js-sha256');

/**
 * Expose `Facebook Pixel`.
 */

var FacebookPixel = (module.exports = integration('Facebook Pixel')
  .global('fbq')
  .option('pixelId', '')
  .option('agent', 'seg')
  .option('valueIdentifier', 'value')
  .option('initWithExistingTraits', false)
  .option('traverse', false)
  .option('automaticConfiguration', true)
  .option('whitelistPiiProperties', [])
  .option('blacklistPiiProperties', [])
  .option('standardEventsCustomProperties', [])
  .option('keyForExternalId', '')
  .option('userIdAsExternalId', false)
  .option('limitedDataUse', true)
  .mapping('standardEvents')
  .mapping('legacyEvents')
  .mapping('contentTypes')
  .tag('<script src="//connect.facebook.net/en_US/fbevents.js">'));

/**
 * FB requires these date fields be formatted in a specific way.
 * The specifications are non iso8601 compliant.
 * https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-travel/audience
 * Therefore, we check if the property is one of these reserved fields.
 * If so, we check if we have converted it to an iso date object already.
 * If we have, we convert it again into Facebook's spec.
 * If we have not, the user has likely passed in a date string that already
 * adheres to FB's docs so we can just pass it through as is.
 */
var dateFields = [
  'checkinDate',
  'checkoutDate',
  'departingArrivalDate',
  'departingDepartureDate',
  'returningArrivalDate',
  'returningDepartureDate',
  'travelEnd',
  'travelStart'
];

/**
 * FB does not allow sending PII data with events. They provide a list of what they consider PII here:
 * https://developers.facebook.com/docs/facebook-pixel/pixel-with-ads/conversion-tracking
 * We need to check each property key to see if it matches what FB considers to be a PII property and strip it from the payload.
 * User's can override this by manually whitelisting keys they are ok with sending through in their integration settings.
 */
var defaultPiiProperties = [
  'email',
  'firstName',
  'lastName',
  'gender',
  'city',
  'country',
  'phone',
  'state',
  'zip',
  'birthday'
];

/**
 * Initialize Facebook Pixel.
 *
 * @param {Facade} page
 */

FacebookPixel.prototype.initialize = function() {
  window._fbq = function() {
    if (window.fbq.callMethod) {
      window.fbq.callMethod.apply(window.fbq, arguments);
    } else {
      window.fbq.queue.push(arguments);
    }
  };

  window.fbq = window.fbq || window._fbq;
  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.disablePushState = true; // disables automatic pageview tracking
  window.fbq.allowDuplicatePageViews = true; // enables fb
  window.fbq.agent = this.options.agent;
  window.fbq.version = '2.0';
  window.fbq.queue = [];
  this.load(this.ready);
  if (!this.options.automaticConfiguration) {
    window.fbq('set', 'autoConfig', false, this.options.pixelId);
  }
  if (this.options.limitedDataUse) {
    this.validateAndSetDataProcessing(
      this.options.dataProcessingOptions || [['LDU'], 0, 0]
    );
  } else {
    // explicitly not enable Limited Data Use (LDU) mode
    window.fbq('dataProcessingOptions', []);
  }
  if (this.options.initWithExistingTraits) {
    var traits = this.formatTraits(this.analytics);
    window.fbq('init', this.options.pixelId, traits);
  } else {
    window.fbq('init', this.options.pixelId);
  }
};

/**
 * Has the Facebook Pixel library been loaded yet?
 *
 * @return {Boolean}
 */

FacebookPixel.prototype.loaded = function() {
  return !!(window.fbq && window.fbq.callMethod);
};

/**
 * Trigger a page view.
 *
 * @param {Facade} identify
 */

FacebookPixel.prototype.page = function(track) {
  window.fbq('track', 'PageView', {}, { eventID: track.proxy('messageId') });
};

/**
 * Track an event.
 *
 * @param {Facade} track
 */

FacebookPixel.prototype.track = function(track) {
  var self = this;
  var event = track.event();
  var revenue = formatRevenue(track.revenue());
  var payload = this.buildPayload(track);

  // Revenue
  if (track.properties().hasOwnProperty('revenue')) {
    payload.value = formatRevenue(track.revenue());
    // To keep compatible with the old implementation
    // that never added revenue to the payload
    delete payload.revenue;
  }

  var standard = this.standardEvents(event);
  var legacy = this.legacyEvents(event);

  // non-mapped events get sent as "custom events" with full
  // tranformed payload
  if (![].concat(standard, legacy).length) {
    window.fbq('trackSingleCustom', this.options.pixelId, event, payload, {
      eventID: track.proxy('messageId')
    });
    return;
  }

  // standard conversion events, mapped to one of 9 standard events
  // "Purchase" requires a currency parameter;
  // send full transformed payload
  each(function(event) {
    if (event === 'Purchase') payload.currency = track.currency(); // defaults to 'USD'
    window.fbq('trackSingle', self.options.pixelId, event, payload, {
      eventID: track.proxy('messageId')
    });
  }, standard);

  // legacy conversion events — mapped to specific "pixelId"s
  // send only currency and value
  each(function(event) {
    window.fbq(
      'trackSingle',
      self.options.pixelId,
      event,
      {
        currency: track.currency(),
        value: revenue
      },
      { eventID: track.proxy('messageId') }
    );
  }, legacy);
};

/**
 * Product List Viewed.
 *
 * @api private
 * @param {Track} track category
 */

FacebookPixel.prototype.productListViewed = function(track) {
  var self = this;
  var contentType;
  var contentIds = [];
  var contents = [];
  var products = track.products();
  var customProperties = this.buildPayload(track, true);

  // First, check to see if a products array with productIds has been defined.
  if (Array.isArray(products)) {
    products.forEach(function(product) {
      var track = new Track({ properties: product });
      var productId =
        track.proxy('properties.product_id') || track.productId() || track.id();

      if (productId) {
        contentIds.push(productId);
        contents.push({
          id: productId,
          quantity: track.quantity()
        });
      }
    });
  }

  // If no products have been defined, fallback on legacy behavior.
  // Facebook documents the content_type parameter decision here: https://developers.facebook.com/docs/facebook-pixel/api-reference
  if (contentIds.length) {
    contentType = ['product'];
  } else {
    contentIds.push(track.category() || '');
    contents.push({
      id: track.category() || '',
      quantity: 1
    });
    contentType = ['product_group'];
  }

  window.fbq(
    'trackSingle',
    this.options.pixelId,
    'ViewContent',
    merge(
      {
        content_ids: contentIds,
        content_type: this.getContentType(track, contentType),
        contents: contents
      },
      customProperties
    ),
    { eventID: track.proxy('messageId') }
  );

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq(
      'trackSingle',
      self.options.pixelId,
      event,
      {
        currency: track.currency(),
        value: formatRevenue(track.revenue())
      },
      { eventID: track.proxy('messageId') }
    );
  }, this.legacyEvents(track.event()));
};

/**
 * Product viewed.
 *
 * @api private
 * @param {Track} track
 */

FacebookPixel.prototype.productViewed = function(track) {
  var self = this;
  var useValue = this.options.valueIdentifier === 'value';
  var customProperties = this.buildPayload(track, true);

  window.fbq(
    'trackSingle',
    this.options.pixelId,
    'ViewContent',
    merge(
      {
        content_ids: [track.productId() || track.id() || track.sku() || ''],
        content_type: this.getContentType(track, ['product']),
        content_name: track.name() || '',
        content_category: track.category() || '',
        currency: track.currency(),
        value: useValue
          ? formatRevenue(track.value())
          : formatRevenue(track.price()),
        contents: [
          {
            id: track.productId() || track.id() || track.sku() || '',
            quantity: track.quantity(),
            item_price: track.price()
          }
        ]
      },
      customProperties
    ),
    { eventID: track.proxy('messageId') }
  );

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq(
      'trackSingle',
      self.options.pixelId,
      event,
      {
        currency: track.currency(),
        value: useValue
          ? formatRevenue(track.value())
          : formatRevenue(track.price())
      },
      { eventID: track.proxy('messageId') }
    );
  }, this.legacyEvents(track.event()));
};

/**
 * Product added.
 *
 * @api private
 * @param {Track} track
 */

FacebookPixel.prototype.productAdded = function(track) {
  var self = this;
  var useValue = this.options.valueIdentifier === 'value';
  var customProperties = this.buildPayload(track, true);

  window.fbq(
    'trackSingle',
    this.options.pixelId,
    'AddToCart',
    merge(
      {
        content_ids: [track.productId() || track.id() || track.sku() || ''],
        content_type: this.getContentType(track, ['product']),
        content_name: track.name() || '',
        content_category: track.category() || '',
        currency: track.currency(),
        value: useValue
          ? formatRevenue(track.value())
          : formatRevenue(track.price()),
        contents: [
          {
            id: track.productId() || track.id() || track.sku() || '',
            quantity: track.quantity(),
            item_price: track.price()
          }
        ]
      },
      customProperties
    ),
    { eventID: track.proxy('messageId') }
  );

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq(
      'trackSingle',
      self.options.pixelId,
      event,
      {
        currency: track.currency(),
        value: useValue
          ? formatRevenue(track.value())
          : formatRevenue(track.price())
      },
      { eventID: track.proxy('messageId') }
    );
  }, this.legacyEvents(track.event()));
};

/**
 * Order Completed.
 *
 * @api private
 * @param {Track} track
 */

FacebookPixel.prototype.orderCompleted = function(track) {
  var self = this;
  var products = track.products();
  var customProperties = this.buildPayload(track, true);

  var revenue = formatRevenue(track.revenue());

  // Order completed doesn't have a top-level category spec'd.
  // Let's default to the category of the first product. - @gabriel

  var contentType = this.getContentType(track, ['product']);
  var contentIds = [];
  var contents = [];

  for (var i = 0; i < products.length; i++) {
    var trackItem = new Track({ properties: products[i] });
    var pId = trackItem.productId() || trackItem.id() || trackItem.sku();
    contentIds.push(pId);
    var content = {
      id: pId,
      quantity: trackItem.quantity()
    };
    if (trackItem.price()) {
      content.item_price = trackItem.price();
    }
    contents.push(content);
  }

  window.fbq(
    'trackSingle',
    this.options.pixelId,
    'Purchase',
    merge(
      {
        content_ids: contentIds,
        content_type: contentType,
        currency: track.currency(),
        value: revenue,
        contents: contents,
        num_items: contentIds.length
      },
      customProperties
    ),
    { eventID: track.proxy('messageId') }
  );

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq(
      'trackSingle',
      self.options.pixelId,
      event,
      {
        currency: track.currency(),
        value: formatRevenue(track.revenue())
      },
      { eventID: track.proxy('messageId') }
    );
  }, this.legacyEvents(track.event()));
};

FacebookPixel.prototype.productsSearched = function(track) {
  var self = this;
  var customProperties = this.buildPayload(track, true);

  window.fbq(
    'trackSingle',
    this.options.pixelId,
    'Search',
    merge(
      {
        search_string: track.proxy('properties.query')
      },
      customProperties
    ),
    { eventID: track.proxy('messageId') }
  );

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq(
      'trackSingle',
      self.options.pixelId,
      event,
      {
        currency: track.currency(),
        value: formatRevenue(track.revenue())
      },
      { eventID: track.proxy('messageId') }
    );
  }, this.legacyEvents(track.event()));
};

FacebookPixel.prototype.checkoutStarted = function(track) {
  var self = this;
  var products = track.products();
  var contentIds = [];
  var contents = [];
  var contentCategory = track.category();
  var customProperties = this.buildPayload(track, true);

  for (var i = 0; i < products.length; i++) {
    var trackItem = new Track({ properties: products[i] });
    var pId = trackItem.productId() || trackItem.id() || trackItem.sku();
    contentIds.push(pId);
    var content = {
      id: pId,
      quantity: trackItem.quantity(),
      item_price: track.price()
    };
    if (trackItem.price()) {
      content.item_price = trackItem.price();
    }
    contents.push(content);
  }

  // If no top-level category was defined use that of the first product. @gabriel
  if (!contentCategory && products[0] && products[0].category) {
    contentCategory = products[0].category;
  }

  window.fbq(
    'trackSingle',
    this.options.pixelId,
    'InitiateCheckout',
    merge(
      {
        content_category: contentCategory,
        content_ids: contentIds,
        content_type: this.getContentType(track, ['product']),
        contents: contents,
        currency: track.currency(),
        num_items: contentIds.length,
        value: formatRevenue(track.revenue())
      },
      customProperties
    ),
    { eventID: track.proxy('messageId') }
  );

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq(
      'trackSingle',
      self.options.pixelId,
      event,
      {
        currency: track.currency(),
        value: formatRevenue(track.revenue())
      },
      { eventID: track.proxy('messageId') }
    );
  }, this.legacyEvents(track.event()));
};

/**
 * Returns an array of mapped content types for the category,
 * the provided value as an integration option or the default provided value.
 *
 * @param {Facade.Track} track Track payload
 * @param {Array} defaultValue Default array value returned if the previous parameters are not defined.
 *
 * @return Content Type array as defined in:
 * - https://developers.facebook.com/docs/facebook-pixel/reference/#object-properties
 * - https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-real-estate/audience
 */
FacebookPixel.prototype.getContentType = function(track, defaultValue) {
  // 1- Integration options takes preference over everything
  var options = track.options('Facebook Pixel');
  if (options && options.contentType) {
    return [options.contentType];
  }

  // 2- Defined by category and its mappings
  var category = track.category();
  if (!category) {
    // Get the first product's category
    var products = track.products();
    if (products && products.length) {
      category = products[0].category;
    }
  }

  if (category) {
    var mapped = this.contentTypes(category);
    if (mapped.length) {
      return mapped;
    }
  }

  // 3- The default value
  return defaultValue;
};

/**
 * Get Revenue Formatted Correctly for FB.
 *
 * @api private
 * @param {Track} track
 */

function formatRevenue(revenue) {
  return Number(revenue || 0).toFixed(2);
}

/**
 * Get Traits Formatted Correctly for FB.
 *
 * https://developers.facebook.com/docs/facebook-pixel/pixel-with-ads/conversion-tracking#advanced_match
 *
 * @api private
 */
FacebookPixel.prototype.formatTraits = function formatTraits(analytics) {
  var traits = analytics && analytics.user().traits();
  if (!traits) return {};
  var firstName;
  var lastName;
  // Check for firstName property
  // else check for name
  if (traits.firstName || traits.first_name) {
    firstName = traits.firstName || traits.first_name;
    lastName = traits.lastName || traits.last_name;
  } else {
    var nameArray = (traits.name && traits.name.toLowerCase().split(' ')) || [];
    firstName = nameArray.shift();
    lastName = nameArray.pop();
  }
  var gender;
  if (traits.gender && is.string(traits.gender)) {
    gender = traits.gender.slice(0, 1).toLowerCase();
  }
  var birthday = traits.birthday && dateformat(traits.birthday, 'yyyymmdd');
  var address = traits.address || {};
  var city =
    address.city &&
    address.city
      .split(' ')
      .join('')
      .toLowerCase();
  var state = address.state && address.state.toLowerCase();
  var postalCode = address.postalCode || address.postal_code;
  var external_id; // eslint-disable-line
  if (this.options.keyForExternalId) {
    external_id = traits[this.options.keyForExternalId]; // eslint-disable-line
  }
  if (!external_id && this.options.userIdAsExternalId && analytics) { // eslint-disable-line
    external_id = analytics.user().id() || analytics.user().anonymousId(); // eslint-disable-line
  }
  return reject({
    em: traits.email,
    fn: firstName,
    ln: lastName,
    ph: traits.phone,
    ge: gender,
    db: birthday,
    ct: city,
    st: state,
    zp: postalCode,
    external_id: external_id  // eslint-disable-line
  });
};

/**
 * Builds the FB Event payload. It checks for PII fields and custom properties. If the event is Standard Event,
 * only properties defined in the setting are passed to the payload.
 *
 * @param {Facade.Track} track Track event.
 * @param {boolean} isStandardEvent Defines if the track call is a standard event.
 *
 * @return Payload to send deriveded from the track properties.
 */
FacebookPixel.prototype.buildPayload = function(track, isStandardEvent) {
  var whitelistPiiProperties = this.options.whitelistPiiProperties || [];
  var blacklistPiiProperties = this.options.blacklistPiiProperties || [];
  var standardEventsCustomProperties =
    this.options.standardEventsCustomProperties || [];

  // Transforming the setting in a map for easier lookups.
  var customPiiProperties = {};
  for (var i = 0; i < blacklistPiiProperties.length; i++) {
    var configuration = blacklistPiiProperties[i];
    customPiiProperties[configuration.propertyName] =
      configuration.hashProperty;
  }

  var payload = {};
  var properties = track.properties();

  for (var property in properties) {
    if (!properties.hasOwnProperty(property)) {
      continue;
    }

    // Standard Events only contains custom properties defined in the configuration
    // If the property is not listed there, we just drop it.
    if (
      isStandardEvent &&
      standardEventsCustomProperties.indexOf(property) < 0
    ) {
      continue;
    }

    var value = properties[property];

    // Dates
    if (dateFields.indexOf(camel(property)) >= 0) {
      if (is.date(value)) {
        payload[property] = value.toISOString().split('T')[0];
        continue;
      }
    }

    // Custom PII properties
    if (customPiiProperties.hasOwnProperty(property)) {
      // hash or drop
      if (customPiiProperties[property] && typeof value === 'string') {
        payload[property] = sha256(value);
      }
      continue;
    }

    // Default PII properties
    var isPropertyPii = defaultPiiProperties.indexOf(property) >= 0;
    var isPropertyWhitelisted = whitelistPiiProperties.indexOf(property) >= 0;
    if (!isPropertyPii || isPropertyWhitelisted) {
      payload[property] = value;
    }
  }

  return payload;
};

/**
 * Validates that a set of parameters are formatted correctly and passes them to the pixel instance.
 * https://developers.facebook.com/docs/marketing-apis/data-processing-options#reference
 *
 * @param {Array} options
 *
 * @api private
 */
FacebookPixel.prototype.validateAndSetDataProcessing = function(params) {
  var lenOk = params.length === 3;
  var valOk =
    Array.isArray(params[0]) &&
    typeof params[1] === 'number' &&
    typeof params[2] === 'number';

  // Pass the data processing options if they're valid, otherwise, fallback to geolocation.
  if (lenOk && valOk) {
    window.fbq('dataProcessingOptions', params[0], params[1], params[2]);
  } else {
    window.fbq('dataProcessingOptions', ['LDU'], 0, 0);
  }
};

/**
 * Merge two javascript objects. This works similarly to `Object.assign({}, obj1, obj2)`
 * but it's compatible with old browsers. The properties of the first argument takes preference
 * over the other.
 *
 * It does not do fancy stuff, just use it with top level properties.
 *
 * @param {Object} obj1 Object 1
 * @param {Object} obj2 Object 2
 *
 * @return {Object} a new object with all the properties of obj1 and the remainder of obj2.
 */
function merge(obj1, obj2) {
  var res = {};

  // All properties of obj1
  for (var propObj1 in obj1) {
    if (obj1.hasOwnProperty(propObj1)) {
      res[propObj1] = obj1[propObj1];
    }
  }

  // Extra properties of obj2
  for (var propObj2 in obj2) {
    if (obj2.hasOwnProperty(propObj2) && !res.hasOwnProperty(propObj2)) {
      res[propObj2] = obj2[propObj2];
    }
  }

  return res;
}

// Exposed only for testing
FacebookPixel.merge = merge;
