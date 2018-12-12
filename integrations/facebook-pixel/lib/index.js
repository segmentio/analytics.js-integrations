'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var foldl = require('@ndhoule/foldl');
var each = require('@ndhoule/each');
var reject = require('reject');
var camel = require('to-camel-case');
var is = require('is');
var dateformat = require('dateformat');
var Track = require('segmentio-facade').Track;

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
  .mapping('standardEvents')
  .mapping('legacyEvents')
  .mapping('contentTypes')
  .tag('<script src="//connect.facebook.net/en_US/fbevents.js">'));

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

FacebookPixel.prototype.page = function() {
  window.fbq('track', 'PageView');
};

/**
 * Track an event.
 *
 * @param {Facade} track
 */

FacebookPixel.prototype.track = function(track) {
  var event = track.event();
  var revenue = formatRevenue(track.revenue());
  var whitelistPiiProperties = this.options.whitelistPiiProperties || [];
  var payload = foldl(
    function(acc, val, key) {
      if (key === 'revenue') {
        acc.value = revenue;
        return acc;
      }

      /**
       * FB requires these date fields be formatted in a specific way.
       * The specifications are non iso8601 compliant.
       * https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-travel/audience
       * Therefore, we check if the property is one of these reserved fields.
       * If so, we check if we have converted it to an iso date object already.
       * If we have, we convert it again into Facebook's spec.
       * If we have not, the user has likely passed in a date string that already
       * adheres to FB's docs so we can just pass it through as is.
       * @ccnixon
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

      if (dateFields.indexOf(camel(key)) >= 0) {
        if (is.date(val)) {
          val = val.toISOString().split('T')[0];
          acc[key] = val;
          return acc;
        }
      }

      // FB does not allow sending PII data with events. They provide a list of what they consider PII here:
      // https://developers.facebook.com/docs/facebook-pixel/pixel-with-ads/conversion-tracking
      // We need to check each property key to see if it matches what FB considers to be a PII property and strip it from the payload.
      // User's can override this by manually whitelisting keys they are ok with sending through in their integration settings.

      var pii = [
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

      var propertyWhitelisted = whitelistPiiProperties.indexOf(key) >= 0;
      if (pii.indexOf(key) >= 0 && !propertyWhitelisted) {
        return acc;
      }

      acc[key] = val;
      return acc;
    },
    {},
    track.properties()
  );

  var standard = this.standardEvents(event);
  var legacy = this.legacyEvents(event);

  // non-mapped events get sent as "custom events" with full
  // tranformed payload
  if (![].concat(standard, legacy).length) {
    window.fbq('trackCustom', event, payload);
    return;
  }

  // standard conversion events, mapped to one of 9 standard events
  // "Purchase" requires a currency parameter;
  // send full transformed payload
  each(function(event) {
    if (event === 'Purchase') payload.currency = track.currency(); // defaults to 'USD'
    window.fbq('track', event, payload);
  }, standard);

  // legacy conversion events — mapped to specific "pixelId"s
  // send only currency and value
  each(function(event) {
    window.fbq('track', event, {
      currency: track.currency(),
      value: revenue
    });
  }, legacy);
};

/**
 * Product List Viewed.
 *
 * @api private
 * @param {Track} track category
 */

FacebookPixel.prototype.productListViewed = function(track) {
  var contentType;
  var contentIds = [];
  var products = track.products();

  // First, check to see if a products array with productIds has been defined.
  if (Array.isArray(products)) {
    products.forEach(function(product) {
      var productId = product.productId || product.product_id;
      if (productId) {
        contentIds.push(productId);
      }
    });
  }

  // If no products have been defined, fallback on legacy behavior.
  // Facebook documents the content_type parameter decision here: https://developers.facebook.com/docs/facebook-pixel/api-reference
  if (contentIds.length) {
    contentType = ['product'];
  } else {
    contentIds.push(track.category() || '');
    contentType = ['product_group'];
  }

  window.fbq('track', 'ViewContent', {
    content_ids: contentIds,
    content_type: this.mappedContentTypesOrDefault(
      track.category(),
      contentType
    )
  });

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq('track', event, {
      currency: track.currency(),
      value: formatRevenue(track.revenue())
    });
  }, this.legacyEvents(track.event()));
};

/**
 * Product viewed.
 *
 * @api private
 * @param {Track} track
 */

FacebookPixel.prototype.productViewed = function(track) {
  var useValue = this.options.valueIdentifier === 'value';

  window.fbq('track', 'ViewContent', {
    content_ids: [track.productId() || track.id() || track.sku() || ''],
    content_type: this.mappedContentTypesOrDefault(track.category(), [
      'product'
    ]),
    content_name: track.name() || '',
    content_category: track.category() || '',
    currency: track.currency(),
    value: useValue
      ? formatRevenue(track.value())
      : formatRevenue(track.price())
  });

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq('track', event, {
      currency: track.currency(),
      value: useValue
        ? formatRevenue(track.value())
        : formatRevenue(track.price())
    });
  }, this.legacyEvents(track.event()));
};

/**
 * Product added.
 *
 * @api private
 * @param {Track} track
 */

FacebookPixel.prototype.productAdded = function(track) {
  var useValue = this.options.valueIdentifier === 'value';

  window.fbq('track', 'AddToCart', {
    content_ids: [track.productId() || track.id() || track.sku() || ''],
    content_type: this.mappedContentTypesOrDefault(track.category(), [
      'product'
    ]),
    content_name: track.name() || '',
    content_category: track.category() || '',
    currency: track.currency(),
    value: useValue
      ? formatRevenue(track.value())
      : formatRevenue(track.price())
  });

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq('track', event, {
      currency: track.currency(),
      value: useValue
        ? formatRevenue(track.value())
        : formatRevenue(track.price())
    });
  }, this.legacyEvents(track.event()));
};

/**
 * Order Completed.
 *
 * @api private
 * @param {Track} track
 */

FacebookPixel.prototype.orderCompleted = function(track) {
  var products = track.products();

  var content_ids = foldl(
    function(acc, product) {
      var item = new Track({ properties: product });
      var key = item.productId() || item.id() || item.sku();
      if (key) acc.push(key);
      return acc;
    },
    [],
    products
  );

  var revenue = formatRevenue(track.revenue());

  // Order completed doesn't have a top-level category spec'd.
  // Let's default to the category of the first product. - @gabriel
  var contentType = ['product'];
  if (products.length) {
    contentType = this.mappedContentTypesOrDefault(
      products[0].category,
      contentType
    );
  }

  window.fbq('track', 'Purchase', {
    content_ids: content_ids,
    content_type: contentType,
    currency: track.currency(),
    value: revenue
  });

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq('track', event, {
      currency: track.currency(),
      value: formatRevenue(track.revenue())
    });
  }, this.legacyEvents(track.event()));
};

FacebookPixel.prototype.productsSearched = function(track) {
  window.fbq('track', 'Search', {
    search_string: track.proxy('properties.query')
  });

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq('track', event, {
      currency: track.currency(),
      value: formatRevenue(track.revenue())
    });
  }, this.legacyEvents(track.event()));
};

FacebookPixel.prototype.checkoutStarted = function(track) {
  var products = track.products();
  var contentIds = [];
  var contents = [];
  var contentCategory = track.category();

  each(function(product) {
    var track = new Track({ properties: product });
    contentIds.push(track.productId() || track.id() || track.sku());
    contents.push({
      id: track.productId() || track.id() || track.sku(),
      quantity: track.quantity(),
      item_price: track.price()
    });
  }, products);

  // If no top-level category was defined use that of the first product. @gabriel
  if (!contentCategory && products[0] && products[0].category) {
    contentCategory = products[0].category;
  }

  window.fbq('track', 'InitiateCheckout', {
    content_category: contentCategory,
    content_ids: contentIds,
    contents: contents,
    currency: track.currency(),
    num_items: contentIds.length,
    value: formatRevenue(track.revenue())
  });

  // fall through for mapped legacy conversions
  each(function(event) {
    window.fbq('track', event, {
      currency: track.currency(),
      value: formatRevenue(track.revenue())
    });
  }, this.legacyEvents(track.event()));
};

/**
 * mappedContentTypesOrDefault returns an array of mapped content types for
 * the category - or returns the defaul value.
 * @param {Facade.Track} track
 * @param {Array} def
 */
FacebookPixel.prototype.mappedContentTypesOrDefault = function(category, def) {
  if (!category) return def;

  var mapped = this.contentTypes(category);
  if (mapped.length) {
    return mapped;
  }

  return def;
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
  if (traits.firstName) {
    firstName = traits.firstName;
    lastName = traits.lastName;
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
  var postalCode = address.postalCode;
  return reject({
    em: traits.email,
    fn: firstName,
    ln: lastName,
    ph: traits.phone,
    ge: gender,
    db: birthday,
    ct: city,
    st: state,
    zp: postalCode
  });
};
