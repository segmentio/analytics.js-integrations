'use strict';

/**
 * Dependencies
 */

var integration = require('@segment/analytics.js-integration');
var dot = require('obj-case');

var iso = require('@segment/to-iso-string');
var Track = require('segmentio-facade').Track;
var trample = require('@segment/trample');

/**
 * hasOwnProperty reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Keys that get applied to `window.s` object,
 * but need to be cleared out before every call.
 *
 * We need to keep this array to share state because otherwise,
 * we can't delete existing keys on the window.s object in between
 * `.track()` and `.page()` calls since they may set different fields.
 * This prevents properties of `.page()` call being sent along with
 * `.track()` calls.
 */

var dynamicKeys = [];

/**
 * Expose `Adobe Analytics`.
 */

var AdobeAnalytics = module.exports = integration('Adobe Analytics');

/**
 * Uses the default `field` from the `window.s` object if it exists,
 * otherwise uses the passed in `value`. Also adds the field to
 * `this.sOptions` and `this.options`
 *
 * @api private
 * @param {string} field
 * @param {*} value
 */

AdobeAnalytics.sOption = function(field, value) {
  var s = window.s_mr_config || window.s;
  var isValid = s && has.call(s, field) && !isEmptyString(field);

  value = isValid ? s[field] : value;

  // Set field and value to this.options
  return this.option(field, value);
};

/**
 * Add our Adobe Analytics instance
 */

AdobeAnalytics
  // Exposed in admin
  .global('s')
  .global('s_gi')
  .option('trackingServerUrl')
  .option('trackingServerSecureUrl')
  .option('events', {})
  .option('eVars', {})
  .option('props', {})
  .option('hVars', {})
  .option('lVars', {})
  .option('contextValues', {})
  .option('customDataPrefix', '')
  .option('reportSuiteId', window.s_account)
  .option('timestampOption', 'enabled')
  .option('productIdentifier', 'name')
  .option('marketingCloudOrgId', null)
  .option('enableTrackPageName', true)
  .option('disableVisitorId', false)
  .option('preferVisitorId', false)
  .option('heartbeatTrackingServerUrl', '')
  .option('ssl', false)

  .option('trackerObjectName', 's')

  // Not exposed in admin
  .sOption('trackingServer')
  .sOption('trackingServerSecure')
  .sOption('visitorID')
  .sOption('channel')
  .sOption('campaign')
  .sOption('state')
  .sOption('zip')
  .sOption('pageName')
  .sOption('visitorMigrationKey')
  .sOption('visitorMigrationServer')
  .sOption('visitorNamespace')
  .sOption('dc')
  .sOption('charSet', 'ISO-8859-1')
  .sOption('currencyCode', 'USD')
  .sOption('trackDownloadLinks', true)
  .sOption('trackExternalLinks', true)
  .sOption('trackInlineStats', true)
  .sOption('linkDownloadFileTypes', 'exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx')
  .sOption('linkInternalFilters')
  .sOption('linkLeaveQueryString', false)
  .sOption('linkTrackVars', 'None')
  .sOption('linkTrackEvents', 'None')
  .sOption('usePlugins', true)
  .tag('default', '<script src="//cdn.metarouter.io/a/assets/adobe/appmeasurement.js">')
  .tag('heartbeat', '<script src="//cdn.metarouter.io/a/assets/adobe/appmeasurement-heartbeat.js">');

/**
 * Initialize.
 *
 * @api public
 */

AdobeAnalytics.prototype.initialize = function() {
  var options = this.options;
  var self = this;

  // Lowercase all keys of event map for easy matching later
  if (!Array.isArray(options.events)) lowercaseKeys(options.events);

  // In case this has been defined already
  window.s_account = window.s_account || options.reportSuiteId;

  // Load the larger Heartbeat script only if the customer has it enabled in settings.
  // This file is considerably bigger, so this check is necessary.
  if (options.heartbeatTrackingServerUrl) {
    this.load('heartbeat', function() {
      window[self.options.trackerObjectName] = self.s = window.__temp_s;
      delete window.__temp_s;

      var s = self.s;

      s.trackingServer = s.trackingServer || options.trackingServerUrl;
      s.trackingServerSecure = s.trackingServerSecure || options.trackingServerSecureUrl;

      // visitorAPI.js is included in our rendering of appmeasurement.js to prevent race conditions
      // current .load() function does not guarantee synchronous loading which AA requires
      // visitorAPI is loaded before appmeasurement.js and initialized after both scripts were loaded synchronously
      if (options.marketingCloudOrgId && window.Visitor && typeof window.Visitor.getInstance === 'function') {
        s.visitor = window.Visitor.getInstance(options.marketingCloudOrgId, {
          trackingServer: s.trackingServer || options.trackingServerUrl,
          trackingServerSecure: s.trackingServerSecure || options.trackingServerSecureUrl
        });

        // Set up for Heartbeat
        self.mediaHeartbeats = {};
        self.adBreakCounts = {};
        self.qosData = {};
        self.playhead = 0;
        self.adBreakInProgress = false;
        self.heartbeatEventMap = {
          // Segment spec'd event: Heartbeat function
          'video playback started': initHeartbeat,
          'video content started': heartbeatVideoStart,
          'video playback paused': heartbeatVideoPaused,
          'video playback resumed': heartbeatVideoStart, // Treated as a 'play' as well.
          'video content completed': heartbeatVideoComplete,
          'video playback completed': heartbeatSessionEnd,
          'video ad started': heartbeatAdStarted,
          'video ad completed': heartbeatAdCompleted,
          'video ad skipped': heartbeatAdSkipped,
          'video playback seek started': heartbeatSeekStarted,
          'video playback seek completed': heartbeatSeekCompleted,
          'video playback buffer started': heartbeatBufferStarted,
          'video playback buffer completed': heartbeatBufferCompleted,
          'video quality updated': heartbeatQualityUpdated,
          'video content playing': heartbeatUpdatePlayhead
        };
      }

      self.ready();
    });
  } else {
    this.load('default', function() {
      window[self.options.trackerObjectName] = self.s = window.__temp_s;
      delete window.__temp_s;

      var s = self.s;
      
      s.trackingServer = s.trackingServer || options.trackingServerUrl;
      s.trackingServerSecure = s.trackingServerSecure || options.trackingServerSecureUrl;

      // visitorAPI.js is included in our rendering of appmeasurement.js to prevent race conditions
      // current .load() function does not guarantee synchronous loading which AA requires
      // visitorAPI is loaded before appmeasurement.js and initialized after both scripts were loaded synchronously
      if (options.marketingCloudOrgId && window.Visitor && typeof window.Visitor.getInstance === 'function') {
        s.visitor = window.Visitor.getInstance(options.marketingCloudOrgId, {
          trackingServer: s.trackingServer || options.trackingServerUrl,
          trackingServerSecure: s.trackingServerSecure || options.trackingServerSecureUrl
        });
      }
      self.ready();
    });
  }
};

/**
 * Adobe Analytics is loaded if the `window.s_gi` function exists.
 *
 * @return {Boolean} loaded
 */

AdobeAnalytics.prototype.loaded = function() {
  return !!window.s_gi;
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

AdobeAnalytics.prototype.page = function(page) {
  // Delete any existing keys on window.s from previous call
  clearKeys(dynamicKeys, this.s);

  // Set the page name
  var pageName = page.fullName();
  // TODO: for nameless analytics.page(), pageName is `undefined`
  // Should we be setting or sending something else here?
  // When window.s.pageName is not set, AA falls back on url which is bad.
  // Not sure what happens when it is sent as `undefined` (not string)
  // Either way, any change here would be breaking
  this.s.pageName = pageName;
  this.s.referrer = page.referrer();

  // Visitor ID aka AA's concept of `userId`.
  // This is not using `update()` so once it is set, it will be sent
  // with `.track()` calls as well.
  // visitorId is not supported for timestamped hits
  // https://marketing.adobe.com/resources/help/en_US/sc/implement/timestamps-overview.html
  if (!this.options.disableVisitorId) {
    var userId = this.analytics.user().id();
    if (userId) {
      if (this.options.timestampOption === 'disabled') this.s.visitorID = userId;
      if (this.options.timestampOption === 'hybrid' && this.options.preferVisitorId) this.s.visitorID = userId;
    }
  }

  // Attach some variables on the `window.s` to be sent with the call
  update(pageName, 'events', this.s);
  updateCommonVariables(page, this.options, this.s);

  calculateTimestamp(page, this.options, this.s);

  // Check if any properties match mapped eVar, prop, or hVar in options
  var properties = page.properties();
  var props = extractProperties(properties, this.options);
  // Attach them to window.s and push to dynamicKeys
  for (var key in props) {
    if (props.hasOwnProperty(key)) {
      update(props[key], key, this.s);
    }
  }

  // Update `s.contextData`
  updateContextData(page, this.options, this.s);

  // actually make the "page" request, just a single "t" not "tl"
  // "t" will send all variables on the window.s while "tl" does not
  // "t" will increment pageviews while "tl" does not
  this.s.t();
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

AdobeAnalytics.prototype.track = function(track) {
  // Delete any existing keys on window.s from previous call
  clearKeys(dynamicKeys, this.s);

  // Map to Heartbeat events if enabled.
  if (this.options.heartbeatTrackingServerUrl) {
    var heartbeatFunc = this.heartbeatEventMap[track.event().toLowerCase()];
    if (heartbeatFunc) {
      heartbeatFunc.call(this, track);
      return; // Heartbeat calls AA itself, so returning here likely prevents dupe data.
    }
  }

  // Find AA event name from setting's event map
  // otherwise abort
  var adobeEvent = aliasEvent(track.event(), this.options.events);
  if (!adobeEvent) return;

  this.processEvent(track);
};

/**
 * Viewed Product.
 *
 * https://segment.com/docs/spec/ecommerce/#viewed-product
 * @api public
 * @param {Track} Track
 */

AdobeAnalytics.prototype.productViewed =  function(track) {
  clearKeys(dynamicKeys, this.s);

  var productVariables = formatProduct(track, this.options.productIdentifier);
  update(productVariables, 'products', this.s);

  this.processEvent(track, 'prodView');
};

AdobeAnalytics.prototype.productListViewed = function(track) {
  clearKeys(dynamicKeys, this.s);
  this.processEvent(track, 'prodView');
};

/**
 * Product Added
 *
 * https://segment.com/docs/spec/ecommerce/#added-removed-product
 * @api public
 * @param {Track} Track
 */

AdobeAnalytics.prototype.productAdded = function(track) {
  clearKeys(dynamicKeys, this.s);

  var productVariables = formatProduct(track, this.options.productIdentifier);
  update(productVariables, 'products', this.s);

  this.processEvent(track, 'scAdd');
};

/**
 * Product Removed
 *
 * https://segment.com/docs/spec/ecommerce/#added-removed-product
 * @api public
 * @param {Track} Track
 */

AdobeAnalytics.prototype.productRemoved = function(track) {
  clearKeys(dynamicKeys, this.s);

  var productVariables = formatProduct(track, this.options.productIdentifier);
  update(productVariables, 'products', this.s);

  this.processEvent(track, 'scRemove');
};

/**
 * Order Completed
 * https://segment.com/docs/spec/ecommerce/#completing-an-order
 * @api public
 * @param {Track} Track
 */

AdobeAnalytics.prototype.orderCompleted = function(track) {
  clearKeys(dynamicKeys, this.s);

  var props = track.properties();
  update(props.purchaseId || track.orderId(), 'purchaseID', this.s);
  update(props.transactionId || track.orderId(), 'transactionID', this.s);

  this.processEvent(track, 'purchase');
};

/**
 * Cart Viewed
 *
 * @api public
 * @param {Track} Track
 */

AdobeAnalytics.prototype.cartViewed = function(track) {
  clearKeys(dynamicKeys, this.s);
  this.processEvent(track, 'scView');
};

/**
 * Checkout Started
 *
 * @api public
 * @param {Track} Track
 */

AdobeAnalytics.prototype.checkoutStarted = function(track) {
  clearKeys(dynamicKeys, this.s);

  var props = track.properties();
  update(props.purchaseId || track.orderId(), 'purchaseID', this.s);
  update(props.transactionId || track.orderId(), 'transactionID', this.s);

  this.processEvent(track, 'scCheckout');
};

/**
 * Update window variables and then fire Adobe track call
 * 
 * @param {*} msg 
 * @param {*} adobeEvent 
 */

AdobeAnalytics.prototype.processEvent = function(msg, adobeEvent) {
  var props = msg.properties();
  
  var products = msg.products();
  if (Array.isArray(products) && !this.s.products) {  // check window because products key could already have been filled upstream
    var productVariables = formatProducts(products, this.options.productIdentifier);
  }

  updateContextData(msg, this.options, this.s);

  var eVarEvent = dot(this.options.eVars, msg.event());
  update(msg.event(), eVarEvent, this.s);

  if (productVariables) update(productVariables, 'products', this.s);

  updateEvents(msg.event(), this.options.events, adobeEvent, this.s);
  updateCommonVariables(msg, this.options, this.s);

  calculateTimestamp(msg, this.options, this.s);

  var mappedProps = extractProperties(props, this.options);
  for (var key in mappedProps) {
    if (mappedProps.hasOwnProperty(key)) {
      update(mappedProps[key], key, this.s);
    }
  }

  if (msg.currency() !== 'USD') update(msg.currency(), 'currencyCode', this.s);

  this.s.linkTrackVars = dynamicKeys.join(',');

  // Send request off to Adobe Analytics
  // 1st param: sets 500ms delay to give browser time, also means you are tracking something other than a href link
  // 2nd param: 'o' means 'Other' as opposed to 'd' for 'Downloads' and 'e' for Exit links
  // 3rd param: link name you will see in reports
  this.s.tl(true, 'o', msg.event());
};

/**
 * Update a number of Adobe Analytics common variables on window.s to be
 * sent with the call
 *
 * @api private
 * @param {Facade} facade
 */

function updateCommonVariables(facade, options, s) {
  var properties = facade.properties();
  var campaign = facade.proxy('context.campaign.name') || properties.campaign;

  update(properties.channel || options.channel, 'channel', s);
  update(campaign || options.campaign, 'campaign', s);
  update(properties.state || options.state, 'state', s);
  update(properties.zip || options.zip, 'zip', s);

  // Some customers have said that adding pageName to s.tl() calls are having adverse effects on their pageview reporting
  // But since it is not reported by all users, we will make this an option.
  if (options.enableTrackPageName && facade.type() === 'track') update(properties.pageName || options.pageName || facade.proxy('context.page.title'), 'pageName', s);
}

/**
 * Update the AA variable and explicitly mark the link vars
 *
 * @api private
 * @param {String, String} value, key
 * @return {string} window.s[key]
 */

function update(value, key, s) {
  // Make sure we have everything we need
  if (!key || value === undefined || value === null || value === '') return;
  // Push each key to be sent later with the payload
  // Only keys listed here will be parsed from the window.s object when data is sent via s.tl() aka `.track()` calls
  dynamicKeys.push(key);
  // Set Adobe Analytics variables on the window.s to be sent
  s[key] = value.toString();
}

/**
 * Update window.s.timestamp
 *
 * Reporting suites can either be timestamp enabled, timestamp optional or timestamp disabled
 * Timestamps cannot be updated if you are setting the visitorId which is why we check that timestamp is preferred for hybrid suites
 * @api private
 * @param {Facade} msg
 * @param {Object} options
 */

function calculateTimestamp(msg, options, s) {
  var setting = options.timestampOption;
  var properties = msg.properties();
  var timestamp = properties.timestamp || msg.timestamp();
  // Timestamp must be either unix or iso-8601
  if (typeof timestamp !== 'string') timestamp = iso(timestamp);
  if (setting === 'disabled') return;
  if (setting === 'enabled') update(timestamp, 'timestamp', s);
  if (setting === 'hybrid' && !options.preferVisitorId) update(timestamp, 'timestamp', s);
}

/**
 * Updates the "events" property on window.s.
 *
 * It accepts a "base" event which is an adobe-specific event like "prodView".
 * Additional events will be custom "eventXXX" events specified by the user in
 * their configuration.
 *
 * @api private
 * @param  {String} event         The Segment event
 * @param  {Object|Array} mapping The configured events mapping
 * @param  {String} base          An Adobe-specific event
 */

function updateEvents(event, mapping, base, s) {
  var value = [ base, aliasEvent(event, mapping) ].filter(Boolean).join(',');
  update(value, 'events', s);
  s.linkTrackEvents = value;
}

/**
 * Update window.s.contextData from event properties and context.
 *
 * Context variables will only be inserted if listed in the "Context Data
 * Variables" mapping. Properties will all be included, but will be prefixed
 * with the "Context Data Property Prefix" setting.
 *
 * @api private
 * @param {Object} context
 */

function updateContextData(facade, options, s) {
  s.contextData = {};

  // All properties, prefixed with `options.customDataPrefix`.
  var properties = trample(facade.properties());
  var propertyPrefix = options.customDataPrefix ? options.customDataPrefix + '.' : '';

  for (var key in properties) {
    if (properties.hasOwnProperty(key)) {
      addContextDatum(propertyPrefix + key, properties[key], s);
    }
  }

  // Context variables named in settings.
  //
  // There is a bug here, but it must be maintained. `extractProperties` will
  // look at *all* our mappings, but only the `contextValues` mapping should be
  // used here.
  var contextProperties = extractProperties(trample(facade.context()), options);
  for (var ckey in contextProperties) {
    if (contextProperties.hasOwnProperty(ckey) && ckey && contextProperties[ckey]) {
      addContextDatum(ckey, contextProperties[ckey], s);
    }
  }
}

/**
 * Add a single key-value pair to the AA `s.contextData`, and append the key to
 * `dynamicKeys`.
 *
 * Be sure to use `dynamicKeys` to construct `s.trackLinkVars`, or calls to
 * `trackLink`/`tl` will not include this value.
 *
 * @api private
 * @param {String} key
 * @param {String} value
 */

function addContextDatum(key, value, s) {
  s.contextData[key] = value;
  dynamicKeys.push('contextData.' + key);
}

/**
 * Alias a regular event `name` to an AA event, using a dictionary of
 * `events`.
 *
 * @api private
 * @param {string} name
 * @param {Object} options
 * @return {string|null}
 */

function aliasEvent(name, mapping) {
  var events = [];
  var key = name.toLowerCase();

  if (mapping) {
    for (var i = 0; i < mapping.length; i++) {
      var map = mapping[i];

      if (map.segmentEvent.toLowerCase() === key) {
        events.push.apply(events, map.adobeEvents);
      }
    }
  }

  return events.join(',');
}

/**
 * Format semantic ecommerce product properties to Adobe Analytics variable strings.
 *
 * @api private
 * @param {Object} props
 * @return {string}
 */

function formatProduct(props, identifier) {
  var quantity = props.quantity() || 1;
  var total = ((props.price() || 0) * quantity).toFixed(2);
  var productIdentifier = props[identifier]();
  // add ecom spec v2 support if identifier is `id`, which only supports ecom spec v1
  if (identifier === 'id') {
    productIdentifier = props.productId() || props.id();
  }

  return [
    props.category(),
    productIdentifier,
    quantity,
    total
  ].join(';');
}

/**
 * Clear last keys used with Adobe Analytics.
 *
 * @api private
 * @param {Array} keys
 */

function clearKeys(keys, s) {
  for (var i = 0; i < keys.length; i++) {
    delete s[keys[i]];
  }

  // Clears the array passed in
  keys.length = 0;
}

/**
 * Extract properties and context values for `window.s`.
 *
 * @api private
 * @param {Object} props
 * @param {Object} options
 */

function extractProperties(props, options) {
  var result = {};
  var mappings = [options.eVars, options.props, options.hVars, options.lVars, options.contextValues];

  // Iterate through each variable mappings to find matching props
  for (var x = 0; x < mappings.length; x++) {
    for (var key in mappings[x]) {
      if (mappings[x].hasOwnProperty(key)) {
        match(mappings[x][key], key);
      }
    }
  }

  function match(mappedValue, mappedKey) {
    var value = dot(props, mappedKey);
    var isarr = Array.isArray(value);
    // make sure it's an acceptable data type
    if (value !== null && !isFunction(value) && (typeof value !== 'object' || isarr)) {
      // list variables should be joined by commas if sent as arrays
      if (/^list\d+$/.test(mappedValue) && isarr) value = value.join();

      result[mappedValue] = value;
    }
  }

  return result;
}

function formatProducts(products, identifier) {
  var productVariables = '';    
  var productDescription;

  // Adobe Analytics wants product description in semi-colon delimited string separated by commas
  for (var x = 0; x < products.length; x++) {
    var product = new Track({ properties: products[x] }); // convert product obj to Facade so formatProduct can query props using Facade methods
    productDescription = formatProduct(product, identifier);
    productVariables += productDescription;
    // if there are more products, delimit using comma
    if (products[x + 1]) productVariables += ',';
  }

  return productVariables;
}

/**
 * Check if function is a function
 *
 * @api private
 * @param {Object} props
 * @param {Object} options
 */

function isFunction(fn) {
  var getType = {};
  return fn && getType.toString.call(fn) === '[object Function]';
}

/**
 *
 * @api private
 * @param {Object} obj
 * @return {Object}
 */

function lowercaseKeys(obj) {
  obj = obj || {};
  var updatedObj = {};

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      updatedObj[key.toLowerCase()] = obj[key];
    }
  }
  return updatedObj;
}

/**
 * Return whether `str` is an empty string.
 *
 *
 * @api private
 * @return {boolean} empty
 */

function isEmptyString(str) {
  // This is technically faster than a flat `str === ''` comparison.
  return typeof str === 'string' && str.length === 0;
}


/**
 * Begin Heartbeat Implementation
 *
 * NOTE: THIS FUNCTIONALITY IS STILL IN BETA, AND NEEDS CLEANUP.
 *
 * Notes for later:
 *
 * 1. The video id (presently mapped to props.asset_id) can NOT be an empty string / undefined.
 * 2. The video player can NOT be an empty string / undefined.
 * 3. All methods here need to be defined up in heartbeatEventMap.
 */

function populateHeartbeat(track) {
  var props = track.properties();
  var mediaHeartbeat = this.mediaHeartbeats[props.session_id || 'default'];

  // If the configuration doesn't already exist, then create it.
  if (!mediaHeartbeat) {
    initHeartbeat.call(this, track, this.s);
  } else {
    var mediaHeartbeatConfig = mediaHeartbeat.config;
    mediaHeartbeatConfig.channel = props.channel || mediaHeartbeatConfig.channel;
    mediaHeartbeatConfig.appVersion = track.proxy('context.app.version') || mediaHeartbeatConfig.appVersion;
    // Default to the latest given value if it exists, else the old value if it exists.
    mediaHeartbeatConfig.playerName = props.video_player || mediaHeartbeatConfig.playerName;
  }
}

function initHeartbeat(track, s) {
  var self = this; // Bound in .track()

  var videoAnalytics = window.ADB.va;
  var props = track.properties();

  var mediaHeartbeatConfig = new videoAnalytics.MediaHeartbeatConfig();
  var mediaHeartbeatDelegate = new videoAnalytics.MediaHeartbeatDelegate();

  mediaHeartbeatConfig.trackingServer = this.options.heartbeatTrackingServerUrl;
  mediaHeartbeatConfig.channel = props.channel || '';
  mediaHeartbeatConfig.ovp = 'unknown'; // TODO: Awaiting spec confirmation.
  mediaHeartbeatConfig.appVersion = track.proxy('context.app.version') || 'unknown';
  mediaHeartbeatConfig.playerName = props.video_player || 'unknown';
  mediaHeartbeatConfig.ssl = this.options.ssl;
  mediaHeartbeatConfig.debugLogging = !!window._enableHeartbeatDebugLogging; // Optional beta flag for seeing debug output.

  mediaHeartbeatDelegate.getCurrentPlaybackTime = function() {
    return self.playhead || 0; // TODO: Bind to the Heartbeat events we have specced.
  };

  mediaHeartbeatDelegate.getQoSObject = function() {
    return self.qosData;
  };

  // Instantiate the real Heartbeat instance.
  this.mediaHeartbeats[props.session_id || 'default'] = {
    heartbeat: new videoAnalytics.MediaHeartbeat(mediaHeartbeatDelegate, mediaHeartbeatConfig, s || this.s), // window.s is our AppMeasurement instance.
    delegate: mediaHeartbeatDelegate,
    config: mediaHeartbeatConfig
  };

  createQosObject.call(this, track);

  heartbeatSessionStart.call(this, track);
}

// This is called when the user intends to start playback (not when the video actually begins to play).
function heartbeatSessionStart(track) {
  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  var streamType = props.livestream ? videoAnalytics.MediaHeartbeat.StreamType.LIVE : videoAnalytics.MediaHeartbeat.StreamType.VOD; // There's also LINEAR, unsure how to differentiate in our spec.
  var mediaObj = videoAnalytics.MediaHeartbeat.createMediaObject(props.title || '', props.asset_id || 'unknown video id', props.total_length || 0, streamType);
  var contextData = {}; // This might be a custom object for the user.

  createStandardVideoMetadata(track, mediaObj);

  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackSessionStart(mediaObj, contextData);
}

// This is called when the video actually starts to playback.
function heartbeatVideoStart(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();

  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackPlay();

  if (!this.mediaHeartbeats[props.session_id || 'default'].chapterInProgress) {
    var chapterObj = videoAnalytics.MediaHeartbeat.createChapterObject(
      props.chapter_name || 'no chapter name',
      props.position || 1,
      props.length || 6000, // This is a temporary max to prevent max from being exceeding if users forget to set a length.
      props.start_time || 0
    );

    /* To be implemented.
    var chapterMetadata = {
      segmentType: props.segmentType || 'no segment type',
      segmentName: props.segmentName || 'no segment name',
      segmentInfo: props.segmentInfo || 'no segment info'
    };
    */

    this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.ChapterStart, chapterObj, {});
    this.mediaHeartbeats[props.session_id || 'default'].chapterInProgress = true;
  }
}

function heartbeatVideoComplete(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.ChapterComplete);
  this.mediaHeartbeats[props.session_id || 'default'].chapterInProgress = false;

  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackComplete();
}

function heartbeatVideoPaused(track) {
  populateHeartbeat.call(this, track);

  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackPause();
}

function heartbeatSessionEnd(track) {
  populateHeartbeat.call(this, track);

  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackSessionEnd();

  // Remove the session from memory when it's all over.
  delete this.mediaHeartbeats[props.session_id || 'default'];
  delete this.adBreakCounts[props.session_id || 'default'];
}

// Right now, we're treating each ad as its own ad break due to a mismatch of our spec and Adobe's.
function heartbeatAdStarted(track) {
  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  var adSessionCount = this.adBreakCounts[props.session_id || 'default'];

  adSessionCount ? adSessionCount = ++this.adBreakCounts[props.session_id || 'default'] : adSessionCount = this.adBreakCounts[props.session_id || 'default'] = 1;

  var adBreakObj = videoAnalytics.MediaHeartbeat.createAdBreakObject(props.type || 'unknown', adSessionCount, props.position || 1);

  // Yes, this completely changes from the explicitly-named functions.
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.AdBreakStart, adBreakObj);
  this.adBreakInProgress = true;

  // Now explicitly start the ad. Optional metadata object can be passed in.
  var adObj = videoAnalytics.MediaHeartbeat.createAdObject(props.title || 'no title', props.asset_id.toString() || 'default ad', props.position || 1, props.total_length || 0);
  createStandardAdMetadata(track, adObj);

  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.AdStart, adObj, props.content || {});
}

function heartbeatAdCompleted(track) {
  var videoAnalytics = window.ADB.va;
  var props = track.properties();

  if (!this.adBreakInProgress) {
    heartbeatAdStarted.call(this, track);
  }

  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.AdComplete);
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.AdBreakComplete);
  this.adBreakInProgress = false;
}

function heartbeatAdSkipped(track) {
  var videoAnalytics = window.ADB.va;
  var props = track.properties();

  if (!this.adBreakInProgress) {
    heartbeatAdStarted.call(this, track);
  }

  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.AdSkip);
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.AdBreakComplete);
  this.adBreakInProgress = false;
}

function heartbeatBufferStarted(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.BufferStart);
}

function heartbeatBufferCompleted(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.BufferComplete);
}

function heartbeatSeekStarted(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.SeekStart);
}

function heartbeatSeekCompleted(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(videoAnalytics.MediaHeartbeat.Event.SeekComplete);
}

function heartbeatQualityUpdated(track) {
  createQosObject.call(this, track);
}

function createStandardVideoMetadata(track, mediaObj) {
  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  var metaKeys = videoAnalytics.MediaHeartbeat.VideoMetadataKeys;
  var stdVidMeta = {};
  var segAdbMap = {
    program: metaKeys.SHOW,
    season: metaKeys.SEASON,
    episode: metaKeys.EPISODE,
    assetId: metaKeys.ASSET_ID,
    contentAssetId: metaKeys.ASSET_ID,
    genre: metaKeys.GENRE,
    airdate: metaKeys.FIRST_AIR_DATE,
    publisher: metaKeys.ORIGINATOR,
    channel: metaKeys.NETWORK,
    rating: metaKeys.RATING
  };

  for (var prop in segAdbMap) { // eslint-disable-line
    // If the property exists on the Segment object, set the Adobe metadata key to that value.
    stdVidMeta[segAdbMap[prop]] = props[prop] || 'no ' + segAdbMap[prop];
  }

  mediaObj.setValue(videoAnalytics.MediaHeartbeat.MediaObjectKey.StandardVideoMetadata, stdVidMeta);
}

function createStandardAdMetadata(track, adObj) {
  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  var metaKeys = videoAnalytics.MediaHeartbeat.AdMetadataKeys;
  var stdAdMeta = {};
  var segAdbMap = {
    publisher: metaKeys.ADVERTISER
  };

  for (var prop in segAdbMap) { // eslint-disable-line
    // If the property exists on the Segment object, set the Adobe metadata key to that value.
    stdAdMeta[segAdbMap[prop]] = props[prop] || 'no ' + segAdbMap[prop];
  }

  adObj.setValue(videoAnalytics.MediaHeartbeat.MediaObjectKey.StandardAdMetadata, stdAdMeta);
}

function heartbeatUpdatePlayhead(track) {
  var props = track.properties();

  this.playhead = props.position;
}

function createQosObject(track) {
  var videoAnalytics = window.ADB.va;
  var props = track.properties();

  // Arguments are not an object. Property order goes: bitrate, startupTime, fps, droppedFrames.
  this.qosData = videoAnalytics.MediaHeartbeat.createQoSObject(
    props.bitrate || 0,
    props.startupTime || 0,
    props.fps || 0,
    props.droppedFrames || 0
  );
}
