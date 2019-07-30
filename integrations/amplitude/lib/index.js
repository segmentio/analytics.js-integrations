'use strict';

/**
 * Module dependencies.
 */

var bind = require('component-bind');
var integration = require('@segment/analytics.js-integration');
var topDomain = require('@segment/top-domain');
var when = require('do-when');
var is = require('is');
var each = require('@ndhoule/each');
var Track = require('segmentio-facade').Track;

/**
 * UMD?
 */

var umd = typeof window.define === 'function' && window.define.amd;

/**
 * Source.
 */

var src = 'https://cdn.amplitude.com/libs/amplitude-5.2.2-min.gz.js';

/**
 * Expose `Amplitude` integration.
 */

var Amplitude = (module.exports = integration('Amplitude')
  .global('amplitude')
  .option('apiKey', '')
  .option('trackAllPages', false)
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true)
  .option('trackUtmProperties', true)
  .option('trackReferrer', false)
  .option('batchEvents', false)
  .option('eventUploadThreshold', 30)
  .option('eventUploadPeriodMillis', 30000)
  .option('useLogRevenueV2', false)
  .option('forceHttps', false)
  .option('trackGclid', false)
  .option('saveParamsReferrerOncePerSession', true)
  .option('deviceIdFromUrlParam', false)
  .option('mapQueryParams', {})
  .option('trackRevenuePerProduct', false)
  .option('preferAnonymousIdForDeviceId', false)
  .option('traitsToSetOnce', [])
  .option('traitsToIncrement', [])
  .tag('<script src="' + src + '">'));

/**
 * Initialize.
 *
 * https://github.com/amplitude/Amplitude-Javascript
 *
 * @api public
 */

Amplitude.prototype.initialize = function() {
  /* prettier-ignore */
  // amplitude snippet (lines loading amplitude cdn-served script are removed as that is already achieved via Segment tag and load methods)
  /* eslint-disable */
  /* istanbul ignore next */
  (function(e,t){var n=e.amplitude||{_q:[],_iq:{}};;function s(e,t){e.prototype[t]=function(){this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));return this}}var o=function(){this._q=[];return this};var a=["add","append","clearAll","prepend","set","setOnce","unset"];for(var u=0;u<a.length;u++){s(o,a[u])}n.Identify=o;var c=function(){this._q=[];return this};var l=["setProductId","setQuantity","setPrice","setRevenueType","setEventProperties"];for(var p=0;p<l.length;p++){s(c,l[p])}n.Revenue=c;var d=["init","logEvent","logRevenue","setUserId","setUserProperties","setOptOut","setVersionName","setDomain","setDeviceId","setGlobalUserProperties","identify","clearUserProperties","setGroup","logRevenueV2","regenerateDeviceId","groupIdentify","onInit","logEventWithTimestamp","logEventWithGroups","setSessionId","resetSessionId"];function v(e){function t(t){e[t]=function(){e._q.push([t].concat(Array.prototype.slice.call(arguments,0)))}}for(var n=0;n<d.length;n++){t(d[n])}}v(n);n.getInstance=function(e){e=(!e||e.length===0?"$default_instance":e).toLowerCase();if(!n._iq.hasOwnProperty(e)){n._iq[e]={_q:[]};v(n._iq[e])}return n._iq[e]};e.amplitude=n})(window,document);
  /* eslint-enable */
  this.setDomain(window.location.href);

  window.amplitude.getInstance().init(this.options.apiKey, null, {
    includeUtm: this.options.trackUtmProperties,
    batchEvents: this.options.batchEvents,
    eventUploadThreshold: this.options.eventUploadThreshold,
    eventUploadPeriodMillis: this.options.eventUploadPeriodMillis,
    forceHttps: this.options.forceHttps,
    includeGclid: this.options.trackGclid,
    saveParamsReferrerOncePerSession: this.options
      .saveParamsReferrerOncePerSession,
    deviceIdFromUrlParam: this.options.deviceIdFromUrlParam,
    deviceId:
      this.options.preferAnonymousIdForDeviceId &&
      this.analytics &&
      this.analytics.user() &&
      this.analytics.user().anonymousId()
  });

  var loaded = bind(this, this.loaded);
  var ready = this.ready;
  // FIXME (wcjohnson11): Refactor the load method to include this logic
  // to better support if UMD present

  /* istanbul ignore if  */
  if (umd) {
    window.require([src], function(amplitude) {
      window.amplitude = amplitude;
      when(loaded, function() {
        window.amplitude.runQueuedFunctions();
        ready();
      });
    });
    return;
  }

  this.load(function() {
    if (window.amplitude.runQueuedFunctions) {
      window.amplitude.runQueuedFunctions();
      ready();
    }
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Amplitude.prototype.loaded = function() {
  return !!(window.amplitude && window.amplitude.getInstance().options);
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Amplitude.prototype.page = function(page) {
  this.setDeviceIdFromAnonymousId(page);

  if (this.options.trackReferrer) this.sendReferrer();

  var category = page.category();
  var name = page.fullName();
  var opts = this.options;

  // all pages
  if (opts.trackAllPages) {
    this.track(page.track());
  }

  // categorized pages
  if (category && opts.trackCategorizedPages) {
    this.track(page.track(category));
  }

  // named pages
  if (name && opts.trackNamedPages) {
    this.track(page.track(name));
  }
};

/**
 * Identify.
 *
 * @api public
 * @param {Facade} identify
 */

Amplitude.prototype.identify = function(identify) {
  this.setDeviceIdFromAnonymousId(identify);

  var id = identify.userId();
  var traits = identify.traits();
  if (id) window.amplitude.getInstance().setUserId(id);

  // map query params from context url if opted in
  var mapQueryParams = this.options.mapQueryParams;
  var query = identify.proxy('context.page.search');
  if (!is.empty(mapQueryParams)) {
    // since we accept any arbitrary property name and we dont have conditional UI components
    // in the app where we can limit users to only add a single mapping, so excuse the temporary jank
    each(function(value, key) {
      traits[key] = query;
    }, mapQueryParams);
  }

  this.setTraits(traits);

  // Set user groups: https://amplitude.zendesk.com/hc/en-us/articles/115001361248#setting-user-groups
  var groups = identify.options(this.name).groups;
  if (groups && is.object(groups)) {
    for (var group in groups) {
      if (groups.hasOwnProperty(group))
        window.amplitude.getInstance().setGroup(group, groups[group]);
    }
  }
};

Amplitude.prototype.setTraits = function(traits) {
  var traitsToIncrement = this.options.traitsToIncrement || [];
  var traitsToSetOnce = this.options.traitsToSetOnce || [];
  var amplitudeIdentify = new window.amplitude.Identify();

  for (var trait in traits) {
    if (!traits.hasOwnProperty(trait)) continue;

    var shouldIncrement = traitsToIncrement.indexOf(trait) >= 0;
    var shouldSetOnce = traitsToSetOnce.indexOf(trait) >= 0;

    if (shouldIncrement) {
      amplitudeIdentify.add(trait, traits[trait]);
    }

    if (shouldSetOnce) {
      amplitudeIdentify.setOnce(trait, traits[trait]);
    }

    if (!shouldIncrement && !shouldSetOnce) {
      amplitudeIdentify.set(trait, traits[trait]);
    }
  }
  window.amplitude.identify(amplitudeIdentify);
};

/**
 * Track.
 *
 * @api public
 * @param {Track} event
 */

Amplitude.prototype.track = logEvent;

function logEvent(track, dontSetRevenue) {
  this.setDeviceIdFromAnonymousId(track);

  var props = track.properties();
  var options = track.options(this.name);
  var event = track.event();
  // map query params from context url if opted in
  var mapQueryParams = this.options.mapQueryParams;
  var query = track.proxy('context.page.search');
  if (!is.empty(mapQueryParams)) {
    var params = {};
    var type;
    // since we accept any arbitrary property name and we dont have conditional UI components
    // in the app where we can limit users to only add a single mapping, so excuse the temporary jank
    each(function(value, key) {
      // add query params to either `user_properties` or `event_properties`
      type = value;
      if (type === 'user_properties') {
        params[key] = query;
      } else {
        props[key] = query;
      }
    }, mapQueryParams);

    if (type === 'user_properties')
      window.amplitude.getInstance().setUserProperties(params);
  }

  // track the event
  if (options.groups) {
    window.amplitude
      .getInstance()
      .logEventWithGroups(event, props, options.groups);
  } else {
    window.amplitude.getInstance().logEvent(event, props);
  }

  // Ideally, user's will track revenue using an Order Completed event.
  // However, we have previously setRevenue for any event given it had a revenue property.
  // We need to keep this behavior around for backwards compatibility.
  if (track.revenue() && !dontSetRevenue)
    this.setRevenue(mapRevenueAttributes(track));
}

Amplitude.prototype.orderCompleted = function(track) {
  this.setDeviceIdFromAnonymousId(track);

  var products = track.products();
  var clonedTrack = track.json();
  var trackRevenuePerProduct = this.options.trackRevenuePerProduct;
  var revenueType = track.proxy('properties.revenueType');
  var revenue = track.revenue();

  // Amplitude does not allow arrays of objects to as properties of events.
  // Our Order Completed event however uses a products array for product level tracking.
  // We need to remove this before logging the event and then use it to track revenue.
  delete clonedTrack.properties.products;

  // There are two ways to track revenue with Amplitude:
  // 1) Log a single Revenue event for all products in the order.
  // 2) Log a Revenue event for each product in the order.
  // If the user has chosen the second option, we pass a dontSetRevenue flag to logEvent.
  logEvent.call(this, new Track(clonedTrack), trackRevenuePerProduct);

  // Loop through products array.
  each(
    function(product) {
      var price = product.price;
      var quantity = product.quantity;
      clonedTrack.properties = product;
      clonedTrack.event = 'Product Purchased';
      // Price and quantity are both required by Amplitude:
      // https://amplitude.zendesk.com/hc/en-us/articles/115001361248#tracking-revenue
      // Price could potentially be 0 so handle that edge case.
      if (trackRevenuePerProduct && price != null && quantity) {
        // Add revenueType if exists, to be able to override.
        if (revenueType) {
          clonedTrack.properties.revenueType = revenueType;
        }
        if (revenue) {
          clonedTrack.properties.revenue = revenue;
        }
        this.setRevenue(mapRevenueAttributes(new Track(clonedTrack)));
      }
      logEvent.call(this, new Track(clonedTrack), trackRevenuePerProduct);
    }.bind(this),
    products
  );
};

/**
 * Group.
 *
 * @api public
 * @param {Group} group
 */

Amplitude.prototype.group = function(group) {
  this.setDeviceIdFromAnonymousId(group);

  var groupType = group.traits()[this.options.groupTypeTrait];
  var groupValue = group.traits()[this.options.groupValueTrait];
  if (groupType && groupValue) {
    window.amplitude.getInstance().setGroup(groupType, groupValue);
  } else {
    var groupId = group.groupId();
    if (groupId) {
      window.amplitude.getInstance().setGroup('[Segment] Group', groupId);
    }
  }
};

/**
 * Set domain name to root domain in Amplitude.
 *
 * @api private
 * @param {string} href
 */

Amplitude.prototype.setDomain = function(href) {
  var domain = topDomain(href);
  window.amplitude.setDomain(domain);
};

/**
 * If enabled by settings, set the device ID from the Segment anonymous ID.
 *
 * This logic cannot be performed at initialization time, because customers may
 * want to modify anonymous IDs between initializing Segment and sending their
 * first event.
 *
 * @api private
 * @param {Fadade} facade to get anonymousId from.
 */
Amplitude.prototype.setDeviceIdFromAnonymousId = function(facade) {
  if (this.options.preferAnonymousIdForDeviceId) {
    this.setDeviceId(facade.anonymousId());
  }
};

/**
 * Override device ID in Amplitude.
 *
 * @api private
 * @param {string} deviceId
 */

Amplitude.prototype.setDeviceId = function(deviceId) {
  if (deviceId) window.amplitude.getInstance().setDeviceId(deviceId);
};

Amplitude.prototype.setRevenue = function(properties) {
  var price = properties.price;
  var productId = properties.productId;
  var revenueType = properties.revenueType;
  var quantity = properties.quantity;
  var eventProps = properties.eventProps;
  var revenue = properties.revenue;

  if (this.options.useLogRevenueV2) {
    // This is to support backwards compatibility with a legacy revenue tracking strategy.
    // Using a properly formatted Order Completed event is the recommended strategy now.
    // If it is properly formatted, this voodoo will not happen.
    if (!price) {
      price = revenue;
      quantity = 1;
    }

    var ampRevenue = new window.amplitude.Revenue()
      .setPrice(price)
      .setQuantity(quantity)
      .setEventProperties(eventProps);

    if (revenueType) ampRevenue.setRevenueType(revenueType);

    if (productId) ampRevenue.setProductId(productId);

    window.amplitude.getInstance().logRevenueV2(ampRevenue);
  } else {
    window.amplitude
      .getInstance()
      .logRevenue(revenue || price * quantity, quantity, productId);
  }
};

// equivalent of sending includeReferrer=true in the amplitude config object when we initialize
Amplitude.prototype.sendReferrer = function() {
  var identify = new window.amplitude.Identify();

  var referrer = this.getReferrer();
  if (!referrer || referrer.length === 0) return;

  identify.setOnce('initial_referrer', referrer);
  identify.set('referrer', referrer);

  var parts = referrer.split('/');
  if (parts.length >= 3) {
    var referringDomain = parts[2];
    identify.setOnce('initial_referring_domain', referringDomain);
    identify.set('referring_domain', referringDomain);
  }

  window.amplitude.getInstance().identify(identify);
};

// wrapper for testing purposes
Amplitude.prototype.getReferrer = function() {
  return document.referrer;
};

function mapRevenueAttributes(track) {
  // Revenue type can be anything such as Refund, Tax, etc.
  // Using mapper here to support future ecomm event => revenue mappings (Order Refund, etc.)
  var mapRevenueType = {
    'order completed': 'Purchase',
    'completed order': 'Purchase',
    'product purchased': 'Purchase'
  };

  return {
    price: track.price(),
    productId: track.productId(),
    revenueType:
      track.proxy('properties.revenueType') ||
      mapRevenueType[track.event().toLowerCase()],
    quantity: track.quantity(),
    eventProps: track.properties(),
    revenue: track.revenue()
  };
}
