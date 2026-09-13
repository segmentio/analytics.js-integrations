'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var convert = require('@segment/convert-dates');
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_hsq');
var each = require('@ndhoule/each');

/**
 * Expose `HubSpot` integration.
 */

var HubSpot = (module.exports = integration('HubSpot')
  .assumesPageview()
  .global('_hsq')
  .global('hbspt')
  .option('portalId', null)
  .option('loadFormsSdk', false)
  .option('enableEuropeanDataCenter', false)
  .tag(
    'global-tag',
    '<script id="hs-analytics" src="https://js.hs-analytics.net/analytics/{{ cacheBuster }}/{{ portalId }}.js">'
  )
  .tag(
    'eu-tag',
    '<script id="hs-analytics" src="https://js-eu1.hs-analytics.net/analytics/{{ cacheBuster }}/{{ portalId }}.js">'
  )
  .tag('forms', '<script src="//js.hsforms.net/forms/shell.js">'));

/**
 * Initialize.
 *
 * @api public
 */

HubSpot.prototype.initialize = function() {
  window._hsq = window._hsq || [];
  var cacheBuster = Math.ceil(new Date() / 300000) * 300000;
  var shouldLoadLeadForms = this.options.loadFormsSdk;
  var self = this;
  var tagName = this.options.enableEuropeanDataCenter ? 'eu-tag' : 'global-tag';
  if (shouldLoadLeadForms) {
    this.load('forms', function() {
      self.load(tagName, { cacheBuster: cacheBuster }, self.ready);
    });
  } else {
    this.load(tagName, { cacheBuster: cacheBuster }, this.ready);
  }
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

HubSpot.prototype.loaded = function() {
  var libLoaded = !!(window._hsq && window._hsq.push !== Array.prototype.push);
  // Due to limitations with our testing framework, we cannot test more than a single script loading configuration.
  // Therefore, we are ignoring this conditional in code coverage.
  /* istanbul ignore if */
  if (!this.options.loadFormsSdk) {
    return libLoaded;
  }
  return libLoaded && !!(window.hbspt && window.hbspt.forms);
};

/**
 * Trims whitespace and invisible characters from a string.
 *
 * @param {string} str - The string to trim.
 * @returns {string} - The trimmed string.
 */
function trimWhitespaceAndInvisibleChars(str) {
  // This regular expression matches leading and trailing whitespace characters,
  // as well as invisible characters such as zero-width spaces and non-breaking spaces.
  return str.replace(
    /^[\s\u200B-\u200D\uFEFF]+|[\s\u200B-\u200D\uFEFF]+$/g,
    ''
  );
}

/**
 * Recursively sanitizes the values of an object or array by trimming whitespace
 * and invisible characters from string values, and preserving the structure of
 * functions, arrays, and nested objects.
 *
 * @param {Object|Array} msg - The object or array to sanitize.
 * @returns {Object|Array} - The sanitized object or array.
 */
function sanitizeValue(msg) {
  if (typeof msg === 'object' && msg !== null) {
    Object.keys(msg).forEach(function(key) {
      var value = msg[key];
      if (typeof value === 'string') {
        msg[key] = trimWhitespaceAndInvisibleChars(value);
      } else if (Array.isArray(value)) {
        msg[key] = value.map(sanitizeValue);
      } else if (typeof value === 'object') {
        msg[key] = sanitizeValue(value);
      }
    });
  }
  return msg;
}

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

HubSpot.prototype.page = function() {
  push('trackPageView');
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

HubSpot.prototype.identify = function(identify) {
  sanitizeValue(identify);
  // use newer version of Identify to have access to `companyName`
  var newIdentify = new Identify({
    traits: identify.traits(),
    userId: identify.userId()
  });

  if (!newIdentify.email()) {
    return;
  }

  var traits = newIdentify.traits({
    firstName: 'firstname',
    lastName: 'lastname'
  });
  traits = convertDates(traits);
  traits = convertAddress(traits);
  traits = formatTraits(traits);

  if (newIdentify.companyName() !== undefined) {
    traits.company = newIdentify.companyName();
  }

  push('identify', traits);
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

HubSpot.prototype.track = function(track) {
  sanitizeValue(track);
  // Hubspot expects properties.id to be the name of the .track() event
  // Ref: http://developers.hubspot.com/docs/methods/enterprise_events/javascript_api
  var props = convertDates(track.properties({ id: '_id', revenue: 'value' }));
  props.id = track.event();

  push('trackEvent', track.event(), props);
};

/**
 * Convert all the dates in the HubSpot properties to millisecond times
 *
 * @api private
 * @param {Object} properties
 */

function convertDates(properties) {
  return convert(properties, function(date) {
    return date.getTime();
  });
}

/**
 * Convert Segment reserved address trait to HubSpot contact properties
 *
 * @api private
 * @param {Object} traits
 * @return {Object} ret
 */
function convertAddress(traits) {
  if (!traits.address) {
    return traits;
  }

  var country = traits.address.country;
  var state = traits.address.state;
  var city = traits.address.city;
  var postalCode = traits.address.postalCode;
  var street = traits.address.street;

  if (street) {
    traits.address = street;
  }

  if (city) {
    traits.city = city;
  }

  if (country) {
    traits.country = country;
  }

  if (state) {
    traits.state = state;
  }

  if (postalCode) {
    traits.zip = postalCode;
  }

  return traits;
}

/**
 * lowercase & snakecase any trait with uppercase letters or spaces
 * Hubspot cannot accept uppercases or spaces
 *
 * @api private
 * @param {Object} traits
 * @return {Object} ret
 */

function formatTraits(traits) {
  var ret = {};
  each(function(value, key) {
    // Using split/join due to IE 11 failing to properly support regex in str.replace()
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/@@replace
    var k = key
      .toLowerCase()
      .split(' ')
      .join('_') // spaces
      .split('.')
      .join('_') // Periods
      .split('\n')
      .join('_') // new lines
      .split('\v')
      .join('_') // Vertical tabs
      .split('\t')
      .join('_') // Regular tabs
      .split('\f')
      .join('_') // form feeds
      .split('\r')
      .join('_'); // Carriage returns
    ret[k] = value;
  }, traits);

  return ret;
}
