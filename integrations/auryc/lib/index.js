'use strict'

var integration = require('@segment/analytics.js-integration')
var is = require('is');
var extend = require('@ndhoule/extend');
var each = require('component-each');
var toISOString = require('@segment/to-iso-string');
var toString = Object.prototype.toString

/**
 * Expose `Auryc` integration
 */

var Auryc = (module.exports = integration('Auryc')
    .option('siteid', null)
    .tag('<script src="https://cdn.auryc.com/{{ siteid }}/container.js"></script>')
    )
/**
 * Initialize Auryc
 */

Auryc.prototype.initialize = function () {
  function safeInvoke(g, fn) {
    return function wrapper() {
        if (g.auryc && typeof g.auryc[fn] !== 'undefined' && g.auryc[fn] !== wrapper) {
            g.auryc[fn].apply(this, Array.prototype.slice.call(arguments, 0));
        }
        else {
            var args = arguments;
            g.aurycReadyCb.push(function () {
                g.auryc[fn].apply(this, Array.prototype.slice.call(args, 0));
            });
        }
    }
}

    (function (g) {
        g.aurycReadyCb = g.aurycReadyCb || [];
        g.auryc = g.auryc || {};
        var fns = ['identify', 'addUserProperties', 'track', 'addSessionProperties', 'pause', 'resume'];
        each(fns, function (fn) {
            g.auryc[fn] = safeInvoke(g, fn);
        });
    })(window)
    this.load(this.ready);
}

Auryc.prototype.loaded = function () {
    return !!window.aurycReadyCb;
};

/**
 * Identify a user
 * 
 * https://docs.auryc.com/knowledge-base/client-side-api/#identify-users
 * 
 * @param {Identify} identify
 */
Auryc.prototype.identify = function (identify) {
    var id = identify.userId();
    if (id) window.auryc.identify(id);
    var traits = identify.traits();
    if (traits) {
      var props = {};
      Object.keys(traits).forEach(function(key){if (key !== 'id') props[key] = traits[key]});
      window.auryc.addUserProperties(normalize(props));
    }
}

/**
 * Track.
 *
 * https://docs.auryc.com/knowledge-base/client-side-api/#custom-events-and-event-properties 
 *
 * @param {Track} track
 */

Auryc.prototype.track = function(track) {
  var props = normalize(track.properties()) || {};
  props['auryc_integration'] = 'segment';
  window.auryc.track(track.event(), props);
};

/**
 * Group
 * 
 * @param {Group} properties 
 */
Auryc.prototype.group = function(group) {
  var props = {};
  var id = group.groupId();
  if (id) {
    props['groupId'] = id;
  }
  var traits = group.traits();
  if (traits) {
    Object.keys(traits).forEach(function(key){
      if (key !== 'id') props['group_' + key] = traits[key]
    });
  }
  if (Object.keys(props).length > 0) {
    window.auryc.addUserProperties(normalize(props));
  }
}

/**
 * Handle all possible data types for properties
 * Data type options include any, array, object, boolean, integer, number, string.
 *
 * @param {Object} properties
 * @return {Object}
 */

function normalize(properties) {
  var normalized = {};
  Object.keys(properties).forEach(function(key) {
    var prop = properties[key];
    if (typeof prop === 'undefined') return;

    if (is.date(prop)) {
      normalized[key] = toISOString(prop);
      return;
    }

    if (is.boolean(prop) || is.number(prop)) {
      normalized[key] = prop;
      return;
    }

    // array of objects. need to flatten
    if (toString.call(prop) === '[object Array]') {
      // Auryc can handle array of int, string, bools, but not objects
      var newProps = [];
      var primitive = true;
      prop.forEach(function (item) {
        if (!primitive) return;
        if (is.date(item)) {
          newProps.push(toISOString(item));
        } else if (is.boolean(item) || is.number(item) || is.string(item)) {
          newProps.push(item);
        } else {
          primitive = false;
        }
      });
      if (primitive) {
        normalized[key] = newProps;
      } else { // has complex types, normalize
        normalized = extend(normalized, unnest(key, prop));
      }
      return;
    }

    if (toString.call(prop) !== '[object Object]') {
      normalized[key] = prop.toString();
      return;
    }

    // anything else
    normalized = extend(normalized, unnest(key, prop));
  });

  return normalized;
}


function unnest(key, value) {
  var nestedObj = {};
  nestedObj[key] = value;
  var flattenedObj = flatten(nestedObj, { safe: true });

  for (var k in flattenedObj) {
    if (is.array(flattenedObj[k])) flattenedObj[k] = JSON.stringify(flattenedObj[k]);
  }

  return flattenedObj;
}

/**
 * Flatten nested objects
 * taken from https://www.npmjs.com/package/flat
 * @param {Object} target
 * @param {Object} opts
 * 
 * @return {Object} output
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
