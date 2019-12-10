'use strict';

/**
 * Module dependencies.
 */

var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var is = require('is');
var push = require('global-queue')('_kmq');
var extend = require('@ndhoule/extend');
var del = require('obj-case').del;

/**
 * Expose `KISSmetrics` integration.
 */

var KISSmetrics = module.exports = integration('KISSmetrics')
  .global('KM')
  .global('_kmil')
  .global('_kmq')
  .option('apiKey', '')
  .option('prefixProperties', true)
  .option('trackCategorizedPages', true)
  .option('trackNamedPages', true)
  .tag('library', '<script src="//scripts.kissmetrics.com/{{ apiKey }}.2.js">');

/**
 * Check if browser is mobile, for kissmetrics.
 *
 * http://support.kissmetrics.com/how-tos/browser-detection.html#mobile-vs-non-mobile
 */

exports.isMobile = navigator.userAgent.match(/Android/i)
  || navigator.userAgent.match(/BlackBerry/i)
  || navigator.userAgent.match(/IEMobile/i)
  || navigator.userAgent.match(/Opera Mini/i)
  || navigator.userAgent.match(/iPad/i)
  || navigator.userAgent.match(/iPhone|iPod/i);

/**
 * Initialize.
 *
 * http://support.kissmetrics.com/apis/javascript
 */

KISSmetrics.prototype.initialize = function() {
  window._kmq = window._kmq || [];
  if (exports.isMobile) push('set', { 'Mobile Session': 'Yes' });
  this.load('library', this.ready);
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */

KISSmetrics.prototype.loaded = function() {
  return is.object(window.KM);
};

/**
 * Page.
 *
 * @param {Page} page
 */

KISSmetrics.prototype.page = function(page) {
  if (!window.KM_SKIP_PAGE_VIEW) {
    push('record', 'Page View', {
      'Viewed URL': page.url(),
      Referrer: page.referrer() || 'Direct'
    });
  }
  this.trackPage(page);
};

/**
 * Track page.
 *
 * @param {Page} page
 */

KISSmetrics.prototype.trackPage = function(page) {
  var category = page.category();
  var name = page.fullName();
  var opts = this.options;

  var e;
  // categorized pages
  if (opts.trackCategorizedPages && category) {
    e = page.category();
  }
  // named pages
  if (opts.trackNamedPages && name) {
    e = page.name();
  }
  if (!e) {
    return;
  }


  var event = 'Viewed ' + e + ' Page';
  var properties = prefix('Page', page.properties());
  push('record', event, properties);
};

/**
 * Identify.
 *
 * @param {Identify} identify
 */

KISSmetrics.prototype.identify = function(identify) {
  var traits = clean(identify.traits());
  var id = identify.userId();
  if (id) push('identify', id);
  if (traits) push('set', traits);
};

/**
 * Track.
 *
 * @param {Track} track
 */

KISSmetrics.prototype.track = function(track) {
  var mapping = { revenue: 'Billing Amount' };
  var event = track.event();
  var properties = clean(track.properties(mapping));
  var revenue = track.revenue();
  if (revenue) {
    // legacy: client side integration used to only send 'Billing Amount', but
    // our server side sent both 'revenue' and 'Billing Amount'. From the docs,
    // http://support.kissmetrics.com/tools/revenue-report.html, ther is no
    // reason to send it as 'Billing Amount', but we don't want to break reports
    // so we send it as 'revenue' and 'Billing Amount' for consistency across
    // platforms.
    properties.revenue = revenue;
  }
  if (this.options.prefixProperties) properties = prefix(event, properties);
  push('record', event, properties);
};

/**
 * Alias.
 *
 * @param {Alias} to
 */

KISSmetrics.prototype.alias = function(alias) {
  push('alias', alias.to(), alias.from());
};

/**
 * Group.
 *
 * @param {Group} to
 */

KISSmetrics.prototype.group = function(group) {
  push('set', prefix('Group', group.traits()));
};

/**
 * Completed order.
 *
 * @param {Track} track
 * @api private
 */

KISSmetrics.prototype.completedOrder = function(track) {
  var opts = this.options;
  var event = track.event();
  var products = track.products();
  var timestamp = toUnixTimestamp(track.timestamp() || new Date());
  var properties = track.properties();
  // since we send product data separately and KM doesn't serialize it anyway (shows up as '[object Object]')
  // we're going to delete the property
  del(properties, 'products');
  if (opts.prefixProperties) properties = prefix(event, properties);

  // transaction
  push('record', event, properties);

  // items
  window._kmq.push(function() {
    each(products, function(product, i) {
      var item = product;
      if (opts) item = prefix(event, item);
      item._t = timestamp + i;
      item._d = 1;
      window.KM.set(item);
    });
  });
};

/**
 * Prefix properties with the event name.
 *
 * @param {String} event
 * @param {Object} properties
 * @return {Object} prefixed
 * @api private
 */

function prefix(event, properties) {
  var prefixed = {};
  each(properties, function(key, val) {
    if (key === 'Billing Amount') {
      prefixed[key] = val;
    } else if (key === 'revenue') {
      prefixed[event + ' - ' + key] = val;
      prefixed['Billing Amount'] = val;
    } else {
      prefixed[event + ' - ' + key] = val;
    }
  });
  return prefixed;
}

function toUnixTimestamp(date) {
  date = new Date(date);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Clean all nested objects and arrays.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function clean(obj) {
  var ret = {};

  for (var k in obj) {
    if (obj.hasOwnProperty(k)) {
      var value = obj[k];
      if (value === null || typeof value === 'undefined') continue;

      // convert date to unix
      if (is.date(value)) {
        ret[k] = toUnixTimestamp(value);
        continue;
      }

      // leave boolean as is
      if (is.bool(value)) {
        ret[k] = value;
        continue;
      }

      // leave  numbers as is
      if (is.number(value)) {
        ret[k] = value;
        continue;
      }

      // convert non objects to strings
      if (value.toString() !== '[object Object]') {
        ret[k] = value.toString();
        continue;
      }

      // json
      // must flatten including the name of the original trait/property
      var nestedObj = {};
      nestedObj[k] = value;
      var flattenedObj = flatten(nestedObj, { safe: true });

      // stringify arrays inside nested object to be consistent with top level behavior of arrays
      for (var key in flattenedObj) {
        if (is.array(flattenedObj[key])) {
          flattenedObj[key] = flattenedObj[key].toString();
        }
      }

      ret = extend(ret, flattenedObj);
      delete ret[k];
    }
  }
  return ret;
}

/**
 * Flatten nested objects
 * taken from https://www.npmjs.com/package/flat
 * @param {Object} obj
 * @return {Object} obj
 * @api public
 */

function flatten(target, opts) {
  opts = opts || {};

  var delimiter = opts.delimiter || '.';
  var maxDepth = opts.maxDepth;
  var currentDepth = 1;
  var output = {};

//   for (var key in p) {
//   if (p.hasOwnProperty(key)) {
//     alert(key + " -> " + p[key]);
//   }
// }


  function step(object, prev) {
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        var value = object[key];
        var isarray = opts.safe && is.array(value);
        var type = Object.prototype.toString.call(value);
        var isobject = type === '[object Object]' || type === '[object Array]';
        var arr = [];

        var newKey = prev
          ? prev + delimiter + key
          : key;

        if (!opts.maxDepth) {
          maxDepth = currentDepth + 1;
        }

        for (var keys in value) {
          if (value.hasOwnProperty(keys)) {
            arr.push(keys);
          }
        }

        if (!isarray && isobject && arr.length && currentDepth < maxDepth) {
          ++currentDepth;
          return step(value, newKey);
        }

        output[newKey] = value;
      }
    }
  }

  step(target);

  return output;
}
