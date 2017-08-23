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

var FacebookPixel = module.exports = integration('Facebook Pixel')
  .global('fbq')
  .option('pixelId', '')
  .option('agent', 'seg')
  .option('valueIdentifier', 'value')
  .option('initWithExistingTraits', false)
  .option('traverse', false)
  .mapping('standardEvents')
  .mapping('legacyEvents')
  .tag('<script src="//connect.facebook.net/en_US/fbevents.js">');

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
  window.fbq.agent = this.options.agent;
  window.fbq.version = '2.0';
  window.fbq.queue = [];
  this.load(this.ready);
  if (this.options.initWithExistingTraits) {
    var traits = formatTraits(this.analytics);
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
  var payload = foldl(function(acc, val, key) {
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

    acc[key] = val;
    return acc;
  }, {}, track.properties());

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
  window.fbq('track', 'ViewContent', {
    content_ids: [track.category() || ''],
    content_type: 'product_group'
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
  window.fbq('track', 'ViewContent', {
    content_ids: [track.productId() || track.id() || track.sku() || ''],
    content_type: 'product',
    content_name: track.name() || '',
    content_category: track.category() || '',
    currency: track.currency(),
    value: this.options.valueIdentifier === 'value' ? formatRevenue(track.value()) : formatRevenue(track.price())
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
 * Product added.
 *
 * @api private
 * @param {Track} track
 */

FacebookPixel.prototype.productAdded = function(track) {
  window.fbq('track', 'AddToCart', {
    content_ids: [track.productId() || track.id() || track.sku() || ''],
    content_type: 'product',
    content_name: track.name() || '',
    content_category: track.category() || '',
    currency: track.currency(),
    value: this.options.valueIdentifier === 'value' ? formatRevenue(track.value()) : formatRevenue(track.price())
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
 * Order Completed.
 *
 * @api private
 * @param {Track} track
 */

FacebookPixel.prototype.orderCompleted = function(track) {
  var content_ids = foldl(function(acc, product) {
    var item = new Track({ properties: product });
    var key = item.productId() || item.id() || item.sku();
    if (key) acc.push(key);
    return acc;
  }, [], track.products() || []);

  var revenue = formatRevenue(track.revenue());

  window.fbq('track', 'Purchase', {
    content_ids: content_ids,
    content_type: 'product',
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

function formatTraits(analytics) {
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
    var nameArray = traits.name && traits.name.toLowerCase().split(' ') || [];
    firstName = nameArray.shift();
    lastName = nameArray.pop();
  }
  var gender;
  if (traits.gender && is.string(traits.gender)) {
    gender = traits.gender.slice(0,1).toLowerCase();
  }
  var birthday = traits.birthday && dateformat(traits.birthday, 'yyyymmdd');
  var address = traits.address || {};
  var city = address.city && address.city.split(' ').join('').toLowerCase();
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
}
