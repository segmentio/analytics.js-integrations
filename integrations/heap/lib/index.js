'use strict';
/* global JSON */
/* eslint no-restricted-globals: [0] */

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var each = require('component-each');
var is = require('is');
var extend = require('@ndhoule/extend');
var toISOString = require('@segment/to-iso-string');
var toString = Object.prototype.toString; // in case this method has been overridden by the user

/**
 * Expose `Heap` integration.
 */

var Heap = module.exports = integration('Heap')
  .global('heap')
  .option('appId', '')
  .tag('<script src="//cdn.heapanalytics.com/js/heap-{{ appId }}.js">');

/**
 * Initialize.
 *
 * https://heapanalytics.com/docs/installation#web
 *
 * @api public
 */

Heap.prototype.initialize = function() {
  window.heap = window.heap || [];
  window.heap.load = function(appid, config) {
    window.heap.appid = appid;
    window.heap.config = config;

    var methodFactory = function(type) {
      return function() {
        window.heap.push([type].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };

    var heapMethods = ['addEventProperties', 'addUserProperties', 'clearEventProperties', 'identify', 'removeEventProperty', 'setEventProperties', 'track', 'unsetEventProperty', 'resetIdentity'];
    each(heapMethods, function(method) {
      window.heap[method] = methodFactory(method);
    });
  };

  window.heap.load(this.options.appId);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Heap.prototype.loaded = function() {
  return !!(window.heap && window.heap.appid);
};

/**
 * Identify.
 *
 * https://heapanalytics.com/docs#identify
 *
 * @api public
 * @param {Identify} identify
 */

Heap.prototype.identify = function(identify) {
  var traits = identify.traits({ email: '_email' });
  var id = identify.userId();
  if (id) window.heap.identify(id);
  window.heap.addUserProperties(clean(traits));
};

/**
 * Track.
 *
 * https://heapanalytics.com/docs#track
 *
 * @api public
 * @param {Track} track
 */

Heap.prototype.track = function(track) {
  window.heap.track(track.event(), clean(track.properties()));
};

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
      // Heap's natively library will drop null and undefined properties anyway
      // so no need to send these
      // also prevents uncaught errors since we call .toString() on non objects
      if (value === null || value === undefined) continue;

      // date
      if (is.date(value)) {
        ret[k] = toISOString(value);
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

      // arrays of objects (eg. `products` array)
      if (toString.call(value) === '[object Array]') {
        ret = extend(ret, trample(k, value));
        continue;
      }

      // non objects
      if (toString.call(value) !== '[object Object]') {
        ret[k] = value.toString();
        continue;
      }

      ret = extend(ret, trample(k, value));
    }
  }
  // json
  // must flatten including the name of the original trait/property
  function trample(key, value) {
    var nestedObj = {};
    nestedObj[key] = value;
    var flattenedObj = flatten(nestedObj, { safe: true });

    // stringify arrays inside nested object to be consistent with top level behavior of arrays
    for (var k in flattenedObj) {
      if (is.array(flattenedObj[k])) flattenedObj[k] = JSON.stringify(flattenedObj[k]);
    }

    return flattenedObj;
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

  function step(object, prev) {
    Object.keys(object).forEach(function(key) {
      var value = object[key];
      var isarray = opts.safe && Array.isArray(value);
      var type = Object.prototype.toString.call(value);
      var isobject = type === '[object Object]' || type === '[object Array]';

      var newKey = prev
        ? prev + delimiter + key
        : key;

      if (!opts.maxDepth) {
        maxDepth = currentDepth + 1;
      }

      if (!isarray && isobject && Object.keys(value).length && currentDepth < maxDepth) {
        ++currentDepth;
        return step(value, newKey);
      }

      output[newKey] = value;
    });
  }

  step(target);

  return output;
}

/**
 * Polyfill Object.keys
 * // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
 * Note: Had to do this because for some reason, the above will not work properly without using Object.keys
 */

if (!Object.keys) {
  Object.keys = function(o) {
    if (o !== Object(o)) {
      throw new TypeError('Object.keys called on a non-object');
    }
    var k = [];
    var p;
    for (p in o) if (Object.prototype.hasOwnProperty.call(o, p)) k.push(p);
    return k;
  };
}
