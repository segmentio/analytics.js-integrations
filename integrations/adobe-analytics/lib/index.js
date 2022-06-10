'use strict';

/**
 * Dependencies
 */

var integration = require('@segment/analytics.js-integration');
var dot = require('obj-case');
var each = require('@ndhoule/each');
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

var AdobeAnalytics = (module.exports = integration('Adobe Analytics'));

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
  var s = window.s;
  var isValid = s && has.call(s, field) && !isEmptyString(field);

  var newValue = isValid ? s[field] : value;

  // TODO: Consider removing this. Not sure why we are doing this since it has no future reference
  this.prototype.sOptions = this.prototype.sOptions || {};
  this.prototype.sOptions[field] = newValue;

  // Set field and value to this.options
  return this.option(field, newValue);
};

/**
 * Add our Adobe Analytics instance
 */

AdobeAnalytics.global('s')
  .global('s_gi')
  .option('events', {})
  .option('eVars', {})
  .option('props', {})
  .option('hVars', {})
  .option('lVars', {})
  .option('merchEvents', [])
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
    'default',
    '<script src="//cdn.segment.com/integrations/adobe-analytics/appmeasurement-2.20.0.js">'
  )
  .tag(
    'heartbeat',
    '<script src="//cdn.segment.com/integrations/adobe-analytics/appmeasurement-2.20.0-heartbeat.js">'
  );

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

  // Initialize a window object that can be used to update the playhead value of a session
  // WITHOUT sending several 'Video Content Playing' events. (see line 1242)
  window._segHBPlayheads = {};

  // Load the larger Heartbeat script only if the customer has it enabled in settings.
  // This file is considerably bigger, so this check is necessary.
  if (options.heartbeatTrackingServerUrl) {
    this.load('heartbeat', function() {
      var s = window.s;
      s.trackingServer = s.trackingServer || options.trackingServerUrl;
      s.trackingServerSecure =
        s.trackingServerSecure || options.trackingServerSecureUrl;

      // visitorAPI.js is included in our rendering of appmeasurement.js to prevent race conditions
      // current .load() function does not guarantee synchronous loading which AA requires
      // visitorAPI is loaded before appmeasurement.js and initialized after both scripts were loaded synchronously
      if (
        options.marketingCloudOrgId &&
        window.Visitor &&
        typeof window.Visitor.getInstance === 'function'
      ) {
        s.visitor = window.Visitor.getInstance(options.marketingCloudOrgId, {
          trackingServer: window.s.trackingServer || options.trackingServerUrl,
          trackingServerSecure:
            window.s.trackingServerSecure || options.trackingServerSecureUrl
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
          'video content playing': heartbeatUpdatePlayhead,
          'video playback interrupted': heartbeatVideoPaused
        };
      }

      self.ready();
    });
  } else {
    this.load('default', function() {
      var s = window.s;
      s.trackingServer = s.trackingServer || options.trackingServerUrl;
      s.trackingServerSecure =
        s.trackingServerSecure || options.trackingServerSecureUrl;

      // visitorAPI.js is included in our rendering of appmeasurement.js to prevent race conditions
      // current .load() function does not guarantee synchronous loading which AA requires
      // visitorAPI is loaded before appmeasurement.js and initialized after both scripts were loaded synchronously
      if (
        options.marketingCloudOrgId &&
        window.Visitor &&
        typeof window.Visitor.getInstance === 'function'
      ) {
        s.visitor = window.Visitor.getInstance(options.marketingCloudOrgId, {
          trackingServer: window.s.trackingServer || options.trackingServerUrl,
          trackingServerSecure:
            window.s.trackingServerSecure || options.trackingServerSecureUrl
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
  clearKeys(dynamicKeys);

  // Set the page name
  var pageName = page.fullName();
  // TODO: for nameless analytics.page(), pageName is `undefined`
  // Should we be setting or sending something else here?
  // When window.s.pageName is not set, AA falls back on url which is bad.
  // Not sure what happens when it is sent as `undefined` (not string)
  // Either way, any change here would be breaking
  window.s.pageName = pageName;
  window.s.referrer = page.referrer();

  // Visitor ID aka AA's concept of `userId`.
  // This is not using `update()` so once it is set, it will be sent
  // with `.track()` calls as well.
  // visitorId is not supported for timestamped hits
  // https://marketing.adobe.com/resources/help/en_US/sc/implement/timestamps-overview.html
  if (!this.options.disableVisitorId) {
    var userId = this.analytics.user().id();
    if (userId) {
      if (this.options.timestampOption === 'disabled')
        window.s.visitorID = userId;
      if (
        this.options.timestampOption === 'hybrid' &&
        this.options.preferVisitorId
      )
        window.s.visitorID = userId;
    }
  }

  // Attach some variables on the `window.s` to be sent with the call
  update(pageName, 'events');
  updateCommonVariables(page, this.options);

  calculateTimestamp(page, this.options);

  // Check if any properties match mapped eVar, prop, or hVar in options
  var props = extractProperties(page, this.options);
  // Attach them to window.s and push to dynamicKeys
  each(update, props);

  // Update `s.contextData`
  updateContextData(page, this.options);

  // actually make the "page" request, just a single "t" not "tl"
  // "t" will send all variables on the window.s while "tl" does not
  // "t" will increment pageviews while "tl" does not
  window.s.t();
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

AdobeAnalytics.prototype.track = function(track) {
  // Delete any existing keys on window.s from previous call
  clearKeys(dynamicKeys);

  var eventName = track.event().toLowerCase();

  // Map to Heartbeat events if enabled.
  if (this.options.heartbeatTrackingServerUrl) {
    var heartbeatFunc = this.heartbeatEventMap[eventName];
    if (heartbeatFunc) {
      heartbeatFunc.call(this, track);
      return; // Heartbeat calls AA itself, so returning here likely prevents dupe data.
    }
  }
  // Check if Segment event is mapped in settings; if not, noop
  var isMapped = this.isMapped(eventName);
  if (!isMapped) {
    return;
  }

  // 'cart opened' is not covered in our ecommerce spec and was one-off specced for this integration
  if (eventName === 'cart opened' || eventName === 'opened cart') {
    this.processEvent(track, 'scOpen');
  } else {
    this.processEvent(track);
  }
};

/**
 * Viewed Product.
 *
 * https://segment.com/docs/spec/ecommerce/#viewed-product
 * @api public
 * @param {Track} Track
 */

AdobeAnalytics.prototype.productViewed = function(track) {
  clearKeys(dynamicKeys);
  this.processEvent(track, 'prodView');
};

AdobeAnalytics.prototype.productListViewed = function(track) {
  clearKeys(dynamicKeys);
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
  clearKeys(dynamicKeys);
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
  clearKeys(dynamicKeys);
  this.processEvent(track, 'scRemove');
};

/**
 * Order Completed
 * https://segment.com/docs/spec/ecommerce/#completing-an-order
 * @api public
 * @param {Track} Track
 */

AdobeAnalytics.prototype.orderCompleted = function(track) {
  clearKeys(dynamicKeys);

  var props = track.properties();
  update(props.purchaseId || track.orderId(), 'purchaseID');
  update(props.transactionId || track.orderId(), 'transactionID');

  this.processEvent(track, 'purchase');
};

/**
 * Cart Viewed
 *
 * @api public
 * @param {Track} Track
 */

AdobeAnalytics.prototype.cartViewed = function(track) {
  clearKeys(dynamicKeys);
  this.processEvent(track, 'scView');
};

/**
 * Checkout Started
 *
 * @api public
 * @param {Track} Track
 */

AdobeAnalytics.prototype.checkoutStarted = function(track) {
  clearKeys(dynamicKeys);

  var props = track.properties();
  update(props.purchaseId || track.orderId(), 'purchaseID');
  update(props.transactionId || track.orderId(), 'transactionID');

  this.processEvent(track, 'scCheckout');
};

/**
 * Update window variables and then fire Adobe track call
 *
 * @param {*} msg Segment Page or Track payload
 * @param {string} adobeEvent Adobe standard event
 */

AdobeAnalytics.prototype.processEvent = function(msg, adobeEvent) {
  var merchEvents = getMerchConfig(msg, this.options);
  var properties = msg.properties();

  // sets `window.s.products`
  setProductsString(
    msg.event(),
    properties,
    adobeEvent,
    this.options.productIdentifier,
    merchEvents.configProductMerchEvent,
    merchEvents.productEVars
  );

  updateContextData(msg, this.options);

  var eVarEvent = dot(this.options.eVars, msg.event());
  update(msg.event(), eVarEvent);

  // sets `window.s.events`
  setEventsString(
    msg.event(),
    properties,
    this.options.events,
    merchEvents.configMerchEvents,
    adobeEvent
  );

  updateCommonVariables(msg, this.options);

  calculateTimestamp(msg, this.options);

  var mappedProps = extractProperties(msg, this.options);
  each(update, mappedProps);

  if (msg.currency() !== 'USD') update(msg.currency(), 'currencyCode');

  window.s.linkTrackVars = dynamicKeys.join(',');

  // Send request off to Adobe Analytics
  // 1st param: sets 500ms delay to give browser time, also means you are tracking something other than a href link
  // 2nd param: 'o' means 'Other' as opposed to 'd' for 'Downloads' and 'e' for Exit links
  // 3rd param: link name you will see in reports
  window.s.tl(true, 'o', msg.event());
};

/**
 * Update a number of Adobe Analytics common variables on window.s to be
 * sent with the call
 *
 * @api private
 * @param {Facade} facade
 */

function updateCommonVariables(facade, options) {
  var properties = facade.properties();
  var campaign = facade.proxy('context.campaign.name') || properties.campaign;

  update(properties.channel || options.channel, 'channel');
  update(campaign || options.campaign, 'campaign');
  update(properties.state || options.state, 'state');
  update(properties.zip || options.zip, 'zip');

  // Some customers have said that adding pageName to s.tl() calls are having adverse effects on their pageview reporting
  // But since it is not reported by all users, we will make this an option.
  if (options.enableTrackPageName && facade.type() === 'track')
    update(
      properties.pageName ||
        options.pageName ||
        facade.proxy('context.page.title'),
      'pageName'
    );
}

/**
 * Update the AA variable and explicitly mark the link vars
 *
 * @api private
 * @param {String, String} value, key
 * @return {string} window.s[key]
 */

function update(value, key) {
  // Make sure we have everything we need
  if (!key || value === undefined || value === null || value === '') return;
  // Push each key to be sent later with the payload
  // Only keys listed here will be parsed from the window.s object when data is sent via s.tl() aka `.track()` calls
  dynamicKeys.push(key);
  // Set Adobe Analytics variables on the window.s to be sent
  window.s[key] = value.toString();
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

function calculateTimestamp(msg, options) {
  var setting = options.timestampOption;
  var properties = msg.properties();
  var timestamp = properties.timestamp || msg.timestamp();
  // Timestamp must be either unix or iso-8601
  if (typeof timestamp !== 'string') timestamp = iso(timestamp);
  if (setting === 'disabled') return;
  if (setting === 'enabled') update(timestamp, 'timestamp');
  if (setting === 'hybrid' && !options.preferVisitorId)
    update(timestamp, 'timestamp');
}

/**
 * Updates the "events" property on window.s.
 *
 * It accepts a "predefinedEvent" event which is an adobe-specific event like "prodView".
 * Additional events will be custom "eventXXX" events specified by the user in
 * their configuration.
 *
 * @api private
 * @param  {String} eventName             The Segment event
 * @param  {Object} properties            The event payloads properties
 * @param  {Object|Array} eventsMap       The configured events mapping
 * @param  {Object|Array} merchEventsMap  The configured merchEvents setting mapping
 * @param  {String} predefinedEvent  An Adobe-specific event (if applicable)
 */

function setEventsString(
  eventName,
  properties,
  eventsMap,
  merchEventsMap,
  predefinedEvent
) {
  var event = eventName.toLowerCase();
  var adobeEvents = predefinedEvent ? [predefinedEvent] : [];

  if (eventsMap.length > 0) {
    // iterate through event map and pull adobe events corresponding to the incoming segment event
    each(function(eventMapping) {
      if (eventMapping.segmentEvent.toLowerCase() === event) {
        each(function(event) {
          if (adobeEvents.indexOf(event) <= 0) {
            adobeEvents.push(event);
          }
        }, eventMapping.adobeEvents);
      }
    }, eventsMap);
  }

  if (merchEventsMap.length > 0) {
    // append adobeEvents with merchMap (currency and counter events)
    each(function(merchMapping) {
      var merchMap = mapMerchEvents(merchMapping, properties);
      each(function(merchEvent) {
        if (adobeEvents.indexOf(merchEvent) <= 0) {
          adobeEvents.push(merchEvent);
        }
      }, merchMap);
    }, merchEventsMap);
  }

  adobeEvents = adobeEvents.filter(function(item) {
    return !!item;
  });
  var value = adobeEvents.join(',');
  update(value, 'events');
  window.s.linkTrackEvents = value;
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

function updateContextData(facade, options) {
  window.s.contextData = {};

  // All properties, prefixed with `options.customDataPrefix`.
  var properties = trample(facade.properties());
  var propertyPrefix = options.customDataPrefix
    ? options.customDataPrefix + '.'
    : '';
  each(function(value, key) {
    addContextDatum(propertyPrefix + key, value);
  }, properties);

  // Context variables named in settings.
  //
  // There is a bug here, but it must be maintained. `extractProperties` will
  // look at *all* our mappings, but only the `contextValues` mapping should be
  // used here.
  var contextProperties = extractProperties(facade, options, 'context');
  each(function(value, key) {
    if (!key || value === undefined || value === null || value === '') {
      return;
    }

    // If context data values are booleans then stringify them.
    // Adobe's SDK seems to reject a false boolean value. Stringifying is
    // acceptable since these values are appended as query strings anyway.
    if (typeof value === 'boolean') {
      addContextDatum(key, value.toString());
      return;
    }

    addContextDatum(key, value);
  }, contextProperties);
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

function addContextDatum(key, value) {
  window.s.contextData[key] = value;
  dynamicKeys.push('contextData.' + key);
}

/**
 *
 * Map event level (order wide) currency & incrementor events.
 * https://docs.adobe.com/content/help/en/analytics/implementation/javascript-implementation/variables-analytics-reporting/page-variables.html
 * Example input:
    "merchEvents": [
      {
        "adobeEvent": "event1",
        "valueScope": "event",
        "segmentProperty": ""
      },
      {
        "adobeEvent": "event34",
        "valueScope": "event",
        "segmentProperty": "total"
      },
      {
        "adobeEvent": "event2",
        "valueScope": "product",
        "segmentProperty": "products.price"
      }
    ]
 *
 * Example output: [event1,event34=20,event2]
 * @api private
 * @param {Objeect|Array} merchEvents
 * @param {Properties} props
 * @return {Object|Array} An array  of Adobe eventts, some may have values.
 */

function mapMerchEvents(merchEvent, props) {
  var merchMap = [];
  if (!merchEvent) {
    return merchMap;
  }

  if (merchEvent.valueScope === 'event') {
    if (merchEvent.segmentProperty in props) {
      var eventString =
        merchEvent.adobeEvent + '=' + String(props[merchEvent.segmentProperty]);
      merchMap.push(eventString);
    } else if (!merchEvent.segmentProperty) {
      // To account for  event with no value
      merchMap.push(merchEvent.adobeEvent);
    }
  } else {
    // If the valueScope is products, the Adobe event must
    // also be passed in on s.events as well, but without a value
    merchMap.push(merchEvent.adobeEvent);
  }
  return merchMap;
}

/**
 * Extract values from  `settings.merchEvents`.
 *
 * Example input:
  settings.merchEvents = [
        {
          'segmentEvent': 'Order Completed',
          'merchEvents': [
            {
              'adobeEvent': 'event3',
              'valueScope': 'event',
              'segmentProperty': 'total'
            }
          ],
          'productEVars': [
            {
              'key': 'products.price',
              'value': 'eVar32'
            }
          ]
        }
      ]
 * @api private
 * @param {Object} msg
 * @param {Object} settings
 * @return {Object}
 */

function getMerchConfig(msg, settings) {
  var eventName = msg.event().toLowerCase();
  var mapping = (settings.merchEvents || []).find(function(setting) {
    return setting.segmentEvent.toLowerCase() === eventName;
  });

  var config = {
    configProductMerchEvent: [],
    configMerchEvents: [],
    productEVars: []
  };

  if (mapping) {
    config.configProductMerchEvent = mapping.merchEvents;
    config.configMerchEvents = dedupeMerchEventSettings(
      mapping.merchEvents || []
    );
    config.productEVars = mapping.productEVars;
  }
  return config;
}

/**
* Dedupe  Merch  Event Setting
* Example input:
  "merchEvents": [
      {
        "adobeEvent": "event1",
        "valueScope": "product",
        "segmentProperty": "products.sku"
      },
      {
        "adobeEvent": "event1",
        "valueScope": "event",
        "segmentProperty": "total"
      }
    ]
* @param {Array} configMerchEvents
* @return {Array}
*/

function dedupeMerchEventSettings(configMerchEvents) {
  var dedupeSettings = {};
  each(function(eventObject) {
    var existingEventObject = dedupeSettings[eventObject.adobeEvent];
    if (
      !existingEventObject ||
      (existingEventObject.valueScope === 'product' &&
        eventObject.valueScope === 'event')
    ) {
      dedupeSettings[eventObject.adobeEvent] = eventObject;
    }
  }, configMerchEvents);

  var res = [];
  for (var adobeEvent in dedupeSettings) {
    if (dedupeSettings[adobeEvent]) {
      res.push(dedupeSettings[adobeEvent]);
    }
  }
  return res;
}

/**
 * Clear last keys used with Adobe Analytics.
 *
 * @api private
 * @param {Array} keys
 */

function clearKeys(keys) {
  each(function(linkVar) {
    delete window.s[linkVar];
  }, keys);
  // Clears the array passed in
  keys.length = 0; //eslint-disable-line
}

/**
 * 1. Extracts properties and context values for `window.s` for `page` and `track` calls.
 * 2. Extracts fields to update custom content metadata on video heartbeat events (from context & properties).
 * 3. Extracts fields from context object to update context data ie. `window.s.contextData`.
 *
 * @api private
 * @param {Facade} facade
 * @param {Object} options
 * @param {String} propType
 */

function extractProperties(facade, options, propType) {
  var result = {};
  var mappings = [
    options.eVars,
    options.props,
    options.hVars,
    options.lVars,
    options.contextValues
  ];

  var topLevelProperties = ['messageId', 'anonymousId', 'event'];

  var props = facade.properties();
  if (propType === 'mergedPropContext') {
    props = merge(trample(facade.properties()), trample(facade.context()));
  } else if (propType === 'context') {
    props = trample(facade.context());
  }

  // Iterate through each variable mappings to find matching props
  for (var x = 0; x < mappings.length; x++) {
    each(match, mappings[x]);
  }

  function match(mappedValue, mappedKey) {
    var value = dot(props, mappedKey);
    // On track and page calls the propType here will be empty. On video HB calls the propTyp will
    // be 'mergedPropContext'. On those events we use  the extracted properties from this fxn to explicitly
    // map link vars on `window.s` object.
    if (topLevelProperties.includes(mappedKey) && propType !== 'context') {
      value = facade.proxy(mappedKey);
    }

    // When we are checking the context object for segment property mappings (updateContextData)
    // we only want set top level fields to Context Data Variables.
    var contextValueKeys = Object.keys(options.contextValues);
    if (
      topLevelProperties.includes(mappedKey) &&
      propType === 'context' &&
      contextValueKeys.includes(mappedKey)
    ) {
      value = facade.proxy(mappedKey);
    }
    var isarr = Array.isArray(value);
    // make sure it's an acceptable data type
    if (
      value !== null &&
      !isFunction(value) &&
      (typeof value !== 'object' || isarr)
    ) {
      // list variables should be joined by commas if sent as arrays
      if (/^list\d+$/.test(mappedValue) && isarr) value = value.join();

      result[mappedValue] = value;
    }
  }

  return result;
}

/**
 * Format product string to set `window.s.products`.
 *
 * @api private
 * @param {string} eventName
 * @param {Prooperties} properties
 * @param {string} adobeEvent
 * @param {string} identifier
 * @param {Object|Array} productMerchEvents
 * @param {Object|Array} productEVars
 */

function setProductsString(
  eventName,
  properties,
  adobeEvent,
  identifier,
  productMerchEvents,
  productEVars
) {
  var singleProductEvent =
    adobeEvent === 'scAdd' ||
    adobeEvent === 'scRemove' ||
    (adobeEvent === 'prodView' && eventName !== 'Product List Viewed');

  // Map to Adobe non-predefined single product event when merchEvents or productEVars is configured.
  var isSingleProductEvent =
    (productMerchEvents.length || productEVars.length) &&
    !Array.isArray(properties.products);

  var productFields =
    singleProductEvent || isSingleProductEvent
      ? [properties]
      : properties.products;

  mapProducts(
    productFields,
    identifier,
    productEVars,
    productMerchEvents,
    properties
  );
}

/**
 * Format products string and set formatted string as value of `window.s.products`.
 *
 * @param {Array} products
 * @param {string} identifier
 * @param {Object|Array} productEVars Array of objects
 * @param {Object|Array} merchEvents Array of objects
 * @param {Properties} properties
 * @return {string}
 * @api private
 */

function mapProducts(
  products,
  identifier,
  productEVars,
  merchEvents,
  properties
) {
  if (!Array.isArray(products)) return;
  var productString = products.map(function(productProperties) {
    var product = new Track({ properties: productProperties });
    var category = product.category() || '';
    var quantity = product.quantity() != null ? product.quantity() : 1;
    // This logic produces NaN results when price is not passed in.
    // This functionality has been in place for too long to simply correct
    // without risking introducing a regression.
    var total = (product.price() * quantity).toFixed(2);
    var item = product[identifier]();
    // support ecom spec v2 when identifier setting == 'id'
    // ecom spec v2 supports object_id convention
    if (identifier === 'id') {
      item = product.productId() || product.id();
    }

    var eventString = '';
    if (merchEvents && merchEvents.length) {
      // to account for top level properties and nested products,
      // we pass in properties and props, a product within products.
      eventString = mapProductEvents(
        merchEvents,
        properties,
        productProperties
      );
    }

    // Format merchandizing eVars:
    // https://docs.adobe.com/content/help/en/analytics/components/variables/merchandising-variables/var-merchandising-impl.html
    var productEVarstring = '';
    if (productEVars && productEVars.length) {
      // We send the entire properties object, because the setting
      // respects the input of products.price, or price for the
      // top level property.
      productEVarstring = mapProductEVars(
        productEVars,
        properties,
        productProperties
      );
    }
    // Note that product level currency and counter events preceed product eVars.
    // Ex: s.products="Category;ABC123;1;10;event1=1.99|event2=25;evar1=2 Day Shipping|evar2=3 Stars"
    if (eventString !== '' || productEVarstring !== '') {
      var test = [
        category,
        item,
        quantity,
        total,
        eventString,
        productEVarstring
      ].map(function(value) {
        if (value == null) {
          return String(value);
        }
        return value;
      });
      return test.join(';');
    }
    return [category, item, quantity, total]
      .map(function(value) {
        if (value == null) {
          return String(value);
        }
        return value;
      })
      .join(';');
  });
  update(productString, 'products');
}

/**
 * Map product-level currency * counter events.
 * https://docs.adobe.com/content/help/en/analytics/implementation/javascript-implementation/variables-analytics-reporting/page-variables.html
 *
 * Example input:
    "merchEvents": [
      {
        "adobeEvent": "event1",
        "valueScope": "product",
        "segmentProperty": "products.foo"
      },
      {
        "adobeEvent": "event2",
        "valueScope": "product",
        "segmentProperty": "priceStatus"
      },
      {
        "adobeEvent": "event34",
        "valueScope": "event",
        "segmentProperty": "products.price"
      },
      {
        "adobeEvent": "event2",
        "valueScope": "event",
        "segmentProperty": ""
      }
    ]
 * @param {Array} merchEvents
 * @param {Object} props
 * @param {Object} product
 * @return {String}
 * @api private
 */

function mapProductEvents(merchEvents, props, product) {
  var merchMap = [];
  var eventString;

  each(function(event) {
    if (event.valueScope === 'product') {
      // Respect what the customer configures in the setting.
      // ex. products.cart_id
      // Only check products if "products." configured in settings.
      if (!event.segmentProperty) {
        // If the customer did not indicate a Segment Property in their settings to
        // associate with the incrementor we will return early.
        return merchMap;
      }
      if (event.segmentProperty.startsWith('products.')) {
        var value = getProductField(event.segmentProperty, product);
        if (value && value !== 'undefined') {
          eventString = event.adobeEvent + '=' + value;
          merchMap.push(eventString);
        }
      } else if (event.segmentProperty in props) {
        eventString =
          event.adobeEvent + '=' + String(props[event.segmentProperty]);
        merchMap.push(eventString);
      }
    }
  }, merchEvents);

  return merchMap.join('|');
}

/**
* Map product merchandising eVars using product syntax
* https://docs.adobe.com/content/help/en/analytics/implementation/javascript-implementation/variables-analytics-reporting/page-variables.html
* Example input:
   "productEVars": [
     {
       "key": "priceStatus",
       "value": "eVar32"
     },
     {
       "key": "discount",
       "value": "eVar17"
     },
   ]
  * @param {Array} productEVars
  * @param {Object} props
  * @param {Object} product
  * @return {String}
 */

function mapProductEVars(productEVars, props, product) {
  var eVars = [];

  each(function(eVar) {
    // Respect what the customer configures in the setting. ex. products.cart_id
    // Only check products if "products." configured in settings.
    if (eVar.key.startsWith('products.')) {
      var productValue = getProductField(eVar.key, product);
      if (productValue && productValue !== 'undefined') {
        eVars.push(eVar.value + '=' + productValue);
      }
    } else if (eVar.key in props) {
      eVars.push(eVar.value + '=' + props[eVar.key]);
    }
  }, productEVars);

  return eVars.join('|');
}

/**
 * Get product key after string
 *
 * Example input: products.isMembershipExclusive or products.$.price
 * Example output: isMembershipExclusive or price
 * @param {String} productString
 * @param {Object} product
 * @return {String}
 */
function getProductField(productString, product) {
  var fields = productString.split('.');
  return product[fields[fields.length - 1]].toString();
}
/**
 * Check if event is mapped in either `events` or `merchEvents` settings.
 * If not, the destination will noop.
 *
 *
 * @param {String} Track payload `event` field.
 * @return {Boolean}
 * @api private
 */

AdobeAnalytics.prototype.isMapped = function(event) {
  return (
    (this.options.events || []).find(function(setting) {
      return setting.segmentEvent.toLowerCase() === event;
    }) ||
    (this.options.merchEvents || []).find(function(setting) {
      return setting.segmentEvent.toLowerCase() === event;
    })
  );
};

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

/* eslint-disable */
function lowercaseKeys(obj) {
  obj = obj || {};
  each(function(value, key) {
    delete obj[key];
    obj[key.toLowerCase()] = value;
  }, obj);
  return obj;
}
/* eslint-disable */

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
    initHeartbeat.call(this, track);
  } else {
    var mediaHeartbeatConfig = mediaHeartbeat.config;
    mediaHeartbeatConfig.channel =
      props.channel || mediaHeartbeatConfig.channel;
    mediaHeartbeatConfig.appVersion =
      track.proxy('context.app.version') || mediaHeartbeatConfig.appVersion;
    // Default to the latest given value if it exists, else the old value if it exists.
    mediaHeartbeatConfig.playerName =
      props.video_player || mediaHeartbeatConfig.playerName;
  }
}

function initHeartbeat(track) {
  var self = this; // Bound in .track()

  var videoAnalytics = window.ADB.va;
  var props = track.properties();

  var mediaHeartbeatConfig = new videoAnalytics.MediaHeartbeatConfig();
  var mediaHeartbeatDelegate = new videoAnalytics.MediaHeartbeatDelegate();

  mediaHeartbeatConfig.trackingServer = this.options.heartbeatTrackingServerUrl;
  mediaHeartbeatConfig.channel = props.channel || '';
  mediaHeartbeatConfig.ovp = 'unknown'; // TODO: Awaiting spec confirmation.
  mediaHeartbeatConfig.appVersion =
    track.proxy('context.app.version') || 'unknown';
  mediaHeartbeatConfig.playerName = props.video_player || 'unknown';
  mediaHeartbeatConfig.ssl = this.options.ssl;
  mediaHeartbeatConfig.debugLogging = !!window._enableHeartbeatDebugLogging; // Optional beta flag for seeing debug output.

  mediaHeartbeatDelegate.getCurrentPlaybackTime = function() {
    var playhead = self.playhead || 0;

    // We allow implementions to set the playhead value of a video session on a shared
    // window object. This allows us to relay the playhead to AA's heartbeat SDK several
    // times a second, without relying on a 'Video Content Playing' event to update the position.
    var sessions = window._segHBPlayheads || {};
    if (sessions[props.session_id]) {
      playhead = sessions[props.session_id];
    }

    return playhead;
  };

  mediaHeartbeatDelegate.getQoSObject = function() {
    return self.qosData;
  };

  // Instantiate the real Heartbeat instance.
  this.mediaHeartbeats[props.session_id || 'default'] = {
    heartbeat: new videoAnalytics.MediaHeartbeat(
      mediaHeartbeatDelegate,
      mediaHeartbeatConfig,
      window.s
    ), // window.s is our AppMeasurement instance.
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
  var streamType = props.livestream
    ? videoAnalytics.MediaHeartbeat.StreamType.LIVE
    : videoAnalytics.MediaHeartbeat.StreamType.VOD; // There's also LINEAR, unsure how to differentiate in our spec.
  var mediaObj = videoAnalytics.MediaHeartbeat.createMediaObject(
    props.title || '',
    props.asset_id || 'unknown video id',
    props.total_length || 0,
    streamType
  );

  // Assign custom context data using the Context Data Variables settings and properties in payload.
  var contextData = createCustomVideoMetadataContext(track, this.options); // This might be a custom object for the user.
  createStandardVideoMetadata(track, mediaObj);

  this.mediaHeartbeats[
    props.session_id || 'default'
  ].heartbeat.trackSessionStart(mediaObj, contextData);
}

// This is called when the video actually starts to playback.
function heartbeatVideoStart(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();

  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackPlay();
  // Assign custom metadata using the Context Data Variables settings and properties in payload.
  var chapterCustomMetadata = createCustomVideoMetadataContext(
    track,
    this.options
  );

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

    this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
      videoAnalytics.MediaHeartbeat.Event.ChapterStart,
      chapterObj,
      chapterCustomMetadata
    );
    this.mediaHeartbeats[props.session_id || 'default'].chapterInProgress = true;
  }
}

function heartbeatVideoComplete(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
    videoAnalytics.MediaHeartbeat.Event.ChapterComplete
  );
  this.mediaHeartbeats[props.session_id || 'default'].chapterInProgress = false;
}

function heartbeatVideoPaused(track) {
  populateHeartbeat.call(this, track);

  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackPause();
}

function heartbeatSessionEnd(track) {
  populateHeartbeat.call(this, track);

  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackComplete();
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

  /* eslint-disable */
  adSessionCount
    ? (adSessionCount = ++this.adBreakCounts[props.session_id || 'default'])
    : (adSessionCount = this.adBreakCounts[props.session_id || 'default'] = 1);
  /* eslint-disable */

  var adBreakObj = videoAnalytics.MediaHeartbeat.createAdBreakObject(
    props.type || 'unknown',
    adSessionCount,
    props.position || 1
  );

  // Yes, this completely changes from the explicitly-named functions.
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
    videoAnalytics.MediaHeartbeat.Event.AdBreakStart,
    adBreakObj
  );
  this.adBreakInProgress = true;

  // Now explicitly start the ad. Optional metadata object can be passed in.
  var adObj = videoAnalytics.MediaHeartbeat.createAdObject(
    props.title || 'no title',
    props.asset_id.toString() || 'default ad',
    props.position || 1,
    props.total_length || 0
  );
  createStandardAdMetadata(track, adObj);

  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
    videoAnalytics.MediaHeartbeat.Event.AdStart,
    adObj,
    props.content || {}
  );
}

function heartbeatAdCompleted(track) {
  var videoAnalytics = window.ADB.va;
  var props = track.properties();

  if (!this.adBreakInProgress) {
    heartbeatAdStarted.call(this, track);
  }

  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
    videoAnalytics.MediaHeartbeat.Event.AdComplete
  );
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
    videoAnalytics.MediaHeartbeat.Event.AdBreakComplete
  );
  this.adBreakInProgress = false;
}

function heartbeatAdSkipped(track) {
  var videoAnalytics = window.ADB.va;
  var props = track.properties();

  if (!this.adBreakInProgress) {
    heartbeatAdStarted.call(this, track);
  }

  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
    videoAnalytics.MediaHeartbeat.Event.AdSkip
  );
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
    videoAnalytics.MediaHeartbeat.Event.AdBreakComplete
  );
  this.adBreakInProgress = false;
}

function heartbeatBufferStarted(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
    videoAnalytics.MediaHeartbeat.Event.BufferStart
  );
}

function heartbeatBufferCompleted(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
    videoAnalytics.MediaHeartbeat.Event.BufferComplete
  );
}

function heartbeatSeekStarted(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
    videoAnalytics.MediaHeartbeat.Event.SeekStart
  );
}

function heartbeatSeekCompleted(track) {
  populateHeartbeat.call(this, track);

  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  this.mediaHeartbeats[props.session_id || 'default'].heartbeat.trackEvent(
    videoAnalytics.MediaHeartbeat.Event.SeekComplete
  );
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

  // eslint-disable-next-line
  for (var prop in segAdbMap) {
    // If the property exists on the Segment object, set the Adobe metadata key to that value.
    stdVidMeta[segAdbMap[prop]] = props[prop] || 'no ' + segAdbMap[prop];
  }

  mediaObj.setValue(
    videoAnalytics.MediaHeartbeat.MediaObjectKey.StandardVideoMetadata,
    stdVidMeta
  );
}

function createCustomVideoMetadataContext(track, options) {
  var contextData = {};

  //Check properties & context object for `settings.contextValue` mappings to assign custom metadata
  var extractedProperties = extractProperties(track, options, 'mergedPropContext');
  each(function(value, key) {
    if (!key || value === undefined || value === null || value === '') {
      return;
    }

    // If context data values are booleans then stringify them.
    // Adobe's SDK seems to reject a false boolean value. Stringifying is
    // acceptable since these values are appended as query strings anyway.
    if (typeof value === 'boolean') {
      contextData[key] = value.toString();
      return;
    }

    contextData[key] = value;
  }, extractedProperties);
  return contextData;
}

function createStandardAdMetadata(track, adObj) {
  var videoAnalytics = window.ADB.va;
  var props = track.properties();
  var metaKeys = videoAnalytics.MediaHeartbeat.AdMetadataKeys;
  var stdAdMeta = {};
  var segAdbMap = {
    publisher: metaKeys.ADVERTISER
  };

  // eslint-disable-next-line
  for (var prop in segAdbMap) {
    // If the property exists on the Segment object, set the Adobe metadata key to that value.
    stdAdMeta[segAdbMap[prop]] = props[prop] || 'no ' + segAdbMap[prop];
  }

  adObj.setValue(
    videoAnalytics.MediaHeartbeat.MediaObjectKey.StandardAdMetadata,
    stdAdMeta
  );
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
