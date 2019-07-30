'use strict';

// https://developer.omniture.com/en_US/content_page/sitecatalyst-tagging/c-tagging-overview
// http://blogs.adobe.com/digitalmarketing/analytics/custom-link-tracking-capturing-user-actions/
// https://developer.omniture.com/en_US/forum/general-topic-forum/difference-between-s-t-and-s-t1

var dot = require('obj-case');
var each = require('@ndhoule/each');
var integration = require('@segment/analytics.js-integration');
var iso = require('@segment/to-iso-string');
var map = require('@ndhoule/map');
var type = require('type-of');

/**
 * hasOwnProperty reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Keys that get applied to `window.s` object,
 * but need to be cleared out before every call.
 */

var dynamicKeys = [];

/**
 * Map of ecommerce event names.
 */

var omnitureEventMap = {
  // ecommerce api
  prodView: [/viewed product/i, /product viewed/i],
  scAdd: [/added product/i, /product added/i],
  scRemove: [/removed product/i, /product removed/i],
  purchase: [/completed order/i, /order completed/i],

  // omniture specific
  scView: [/viewed cart/i, /cart viewed/i],
  // whatever that means
  scOpen: [/opened cart/i, /cart opened/i],
  scCheckout: [/viewed checkout/i, /started checkout/i, /checkout started/i]
};

/**
 * Expose `Omniture`.
 */

var Omniture = (module.exports = integration('Omniture'));

/**
 * Uses the default `field` from the `window.s` object if it exists,
 * otherwise uses the passed in `value`. Also adds the field to
 * `this.sOptions`.
 *
 * @api private
 * @param {string} field
 * @param {*} value
 */

Omniture.sOption = function(field, value) {
  var s = window.s;
  var isValid = s && has.call(s, field) && !isEmptyString(field);

  value = isValid ? s[field] : value;

  this.prototype.sOptions = this.prototype.sOptions || {};
  this.prototype.sOptions[field] = value;

  return this.option(field, value);
};

/**
 * Add our omniture
 */

Omniture.global('s')
  .global('s_gi')
  .option('initialPage', true)
  .option('events', {})
  .option('eVars', {})
  .option('props', {})
  .option('hVars', {})
  .option('reportSuiteId', window.s_account)
  .option('includeTimestamp', true)
  .sOption('visitorID')
  .sOption('channel')
  .sOption('campaign')
  .sOption('state')
  .sOption('zip')
  .sOption('pageName')
  .sOption('trackingServer')
  .sOption('trackingServerSecure')
  .sOption('visitorMigrationKey')
  .sOption('visitorMigrationServer')
  .sOption('visitorNamespace')
  .sOption('dc')
  .sOption('charSet', 'ISO-8859-1')
  .sOption('currencyCode', 'USD')
  .sOption('trackDownloadLinks', true)
  .sOption('trackExternalLinks', true)
  .sOption('trackInlineStats', true)
  .sOption(
    'linkDownloadFileTypes',
    'exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx'
  )
  .sOption('linkInternalFilters')
  .sOption('linkLeaveQueryString', false)
  .sOption('linkTrackVars', 'None')
  .sOption('linkTrackEvents', 'None')
  .sOption('usePlugins', true)
  .tag(
    '<script src="//cdn.segment.io/integrations/omniture/H.26.2/omniture.min.js">'
  );

/**
 * Initialize.
 *
 * @api public
 */

Omniture.prototype.initialize = function() {
  var options = this.options;

  // lowercase all keys for easy matching
  lowercaseKeys(options.events);

  window.s_account = window.s_account || options.reportSuiteId;
  var self = this;

  this.loadedBySegmentio = true;

  this.load(function() {
    var s = window.s;
    // TODO: rename on server-side and mobile
    s.trackingServer = s.trackingServer || options.trackingServerUrl;
    s.trackingServerSecure =
      s.trackingServerSecure || options.trackingServerSecureUrl;
    self.ready();
  });
};

/**
 * Omniture is loaded if the `window.s_gi` function exists.
 *
 * @return {Boolean} loaded
 */

Omniture.prototype.loaded = function() {
  return !!window.s_gi;
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Omniture.prototype.track = function(track) {
  if (!window.s_gi) return;

  var event = aliasEvent(track.event(), this.options.events);
  if (!event) return;

  var properties = track.properties();
  window.s.linkTrackEvents = event;

  clearKeys(dynamicKeys);

  // Update the omniture variable and explicitly mark the link vars
  function update(value, key) {
    if (!key || value === undefined || value === null) return;
    dynamicKeys.push(key);
    window.s[key] = value.toString();
  }

  update(event, 'events');
  update(properties.channel || this.options.channel, 'channel');
  update(properties.campaign || this.options.campaign, 'campaign');
  update(properties.pageName || this.options.pageName, 'pageName');
  update(properties.state || this.options.state, 'state');
  update(properties.zip || this.options.zip, 'zip');
  update(properties.purchaseId, 'purchaseID');
  update(properties.transactionId, 'transactionId');

  // Timestamp must be either unix or iso-8601
  // See docs.pdf page 98.
  if (this.options.includeTimestamp) {
    var timestamp = properties.timestamp || track.timestamp();
    if (typeof timestamp !== 'string') timestamp = iso(timestamp);
    update(timestamp, 'timestamp');
  }

  // Alias for omniture specific events.
  if (omnitureEventMap[event]) {
    if (properties.product || track.sku()) {
      update(formatProduct(properties), 'products');
    } else {
      var products = properties.products;
      if (products && type(products) === 'array') {
        var productStrings = map(formatProduct, products);
        update(productStrings.join(', '), 'products');
      }
    }
  }

  // Set props and eVars for event properties
  var props = extractProperties(properties, this.options);
  each(update, props);

  // Set eVar for event name
  var eventEVar = dot(this.options.eVars, track.event());
  update(track.event(), eventEVar);

  window.s.linkTrackVars = dynamicKeys.join(',');

  // Send request off to Omniture
  window.s.tl(true, 'o', track.event());
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Omniture.prototype.page = function(page) {
  var options = this.options;
  // If we ignore the first pageview, enable for all subsequent pageviews
  if (options.page == null) options.page = options.initialPage;
  if (!options.page) {
    options.page = true;
    return;
  }

  // If omniture isn't loaded yet, try again soon.
  if (!this.loaded()) {
    var self = this;
    setTimeout(function() {
      self.page(page);
    }, 100);
    return;
  }

  // Set the page name
  var name = page.fullName();
  window.s.pageName = name;

  // Visitor ID.
  var user = this.analytics.user();
  if (user.id()) window.s.visitorID = user.id();

  // Get the properties
  var track = page.track();
  var properties = track.properties();

  clearKeys(dynamicKeys);
  // Update the omniture variable and explicitly mark the link vars
  function update(value, key) {
    if (!key || value === undefined || value === null) return;
    dynamicKeys.push(key);
    window.s[key] = value.toString();
  }

  update(name, 'events');
  update(properties.channel || this.options.channel, 'channel');
  update(properties.campaign || this.options.campaign, 'campaign');
  update(properties.state || this.options.state, 'state');
  update(properties.zip || this.options.zip, 'zip');
  update(properties.purchaseId, 'purchaseID');
  update(properties.transactionId, 'transactionId');

  if (this.options.includeTimestamp) {
    var timestamp = properties.timestamp || track.timestamp();
    if (typeof timestamp !== 'string') timestamp = iso(timestamp);
    update(timestamp, 'timestamp');
  }

  var props = extractProperties(properties, this.options);
  each(update, props);

  // actually make the "page" request, just a single "t" no "tl"
  window.s.t();
};

/**
 * Alias a regular event `name` to an Omniture event, using a dictionary of
 * `events`.
 *
 * @api private
 * @param {string} name
 * @param {Object} events
 * @return {string|null}
 */

function aliasEvent(name, events) {
  var aliased = null;

  // First attempt to look through omniture events
  each(function(value, key) {
    if (name === key) {
      aliased = key;
      return;
    }

    var regexes = omnitureEventMap[key];

    for (var i = 0; i < regexes.length; i++) {
      if (regexes[i].test(name)) {
        aliased = key;
        return;
      }
    }
  }, omnitureEventMap);

  if (aliased) return aliased;

  // Otherwise if it has an aliased name to a stored event.
  if (events[name.toLowerCase()]) return events[name.toLowerCase()];

  // Hope that they passed in a normal event
  if (/event\d+/.test(name)) return name;
}

/**
 * Format product descriptions from objects to Omniture description strings.
 *
 * @api private
 * @param {Object} description
 * @return {string}
 */

function formatProduct(description) {
  var quantity = description.quantity || 1;
  var total = ((description.price || 0) * quantity).toFixed(2);
  return [
    description.category,
    description.product || description.sku,
    quantity,
    total
  ].join('; ');
}

/**
 * Return whether `str` is an empty string.
 *
 * @api private
 * @return {boolean} empty
 */

function isEmptyString(str) {
  return typeof str === 'string' && str.length === 0;
}

/**
 * Clear last keys used with omniture.
 *
 * @api private
 * @param {Array} keys
 */

function clearKeys(keys) {
  each(function(linkVar) {
    delete window.s[linkVar];
  }, keys);
  keys.length = 0;
}

/**
 * Extract properties for `window.s`.
 *
 * @api private
 * @param {Object} props
 * @param {Object} options
 */

function extractProperties(props, options) {
  var result = {};

  // 1. map eVars
  each(function(mappedValue, mappedKey) {
    var value = dot(props, mappedKey);
    // for backwards compatibility
    if (value != null) result[mappedValue] = value;
  }, options.eVars);

  // 2. map props
  each(function(mappedValue, mappedKey) {
    var value = dot(props, mappedKey);
    if (value != null) result[mappedValue] = value;
  }, options.props);

  // 3. map hVars
  each(function(mappedValue, mappedKey) {
    var value = dot(props, mappedKey);
    if (value != null) result[mappedValue] = value;
  }, options.hVars);

  // 4. map basic properties
  // they don't have a specific mapping, but
  // named it like omniture does
  each(function(value, key) {
    if (/prop\d+/i.test(key) || /eVar\d+/i.test(key) || /hier\d+/i.test(key)) {
      result[key] = value;
      return;
    }
    var prop = dot(options.props, key);
    var eVar = dot(options.eVars, key);
    var hVar = dot(options.hVars, key);
    // Add case for mirroring a prop post check.
    if (!eVar && prop) eVar = options.eVars[prop];
    if (prop) result[prop] = value;
    if (eVar) result[eVar] = value;
    if (hVar) result[hVar] = value;
  }, props);

  return result;
}

/**
 * Lowercase all of an object's keys.
 *
 * @api private
 * @param {Object} obj
 * @return {Object}
 */

function lowercaseKeys(obj) {
  obj = obj || {};
  each(function(value, key) {
    delete obj[key];
    obj[key.toLowerCase()] = value;
  }, obj);
  return obj;
}
