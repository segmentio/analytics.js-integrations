'use strict';

/**
 * Module dependencies.
 */

var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var toSnakeCase = require('to-snake-case');
var is = require('is');
var foldl = require('@ndhoule/foldl');
var json = require('json3');
var isostring = require('isostring');
var time = require('unix-time');

/**
 * Expose `Woopra` integration.
 */

var Woopra = module.exports = integration('Woopra')
  .global('woopra')
  .option('domain', '')
  .option('cookieName', 'wooTracker')
  .option('cookieDomain', null)
  .option('cookiePath', '/')
  .option('ping', true)
  .option('pingInterval', 12000)
  .option('idleTimeout', 300000)
  .option('downloadTracking', true)
  .option('outgoingTracking', true)
  .option('outgoingIgnoreSubdomain', true)
  .option('downloadPause', 200)
  .option('outgoingPause', 400)
  .option('ignoreQueryUrl', true)
  .option('hideCampaign', false)
  .tag('<script src="//static.woopra.com/js/w.js">');

/**
 * Initialize.
 *
 * http://www.woopra.com/docs/setup/javascript-tracking/
 */

Woopra.prototype.initialize = function() {
  /* eslint-disable */
  (function(){var i, s, z, w = window, d = document, a = arguments, q = 'script', f = ['config', 'track', 'identify', 'visit', 'push', 'call'], c = function(){var i, self = this; self._e = []; for (i = 0; i < f.length; i++){(function(f){self[f] = function(){self._e.push([f].concat(Array.prototype.slice.call(arguments, 0))); return self; }; })(f[i]); } }; w._w = w._w || {}; for (i = 0; i < a.length; i++){ w._w[a[i]] = w[a[i]] = w[a[i]] || new c(); } })('woopra');
  /* eslint-enable */

  this.load(this.ready);
  each(this.options, function(key, value) {
    key = toSnakeCase(key);
    if (value == null) return;
    if (value === '') return;
    window.woopra.config(key, value);
  });
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */

Woopra.prototype.loaded = function() {
  return !!(window.woopra && window.woopra.loaded);
};

/**
 * Page.
 *
 * @param {String} category (optional)
 */

Woopra.prototype.page = function(page) {
  var props = page.properties();
  var name = page.fullName();
  if (name) props.title = name;
  window.woopra.track('pv', props);
};

/**
 * Identify.
 *
 * @param {Identify} identify
 */

Woopra.prototype.identify = function(identify) {
  var traits = identify.traits();

  // Woopra likes timestamps in milliseconds
  // Ref: https://www.woopra.com/docs/manual/configure-schema/
  each(traits, function(key, val) {
    if (isostring(val) || is.date(val)) {
      traits[key] = time(val) * 1000;
    }
  });

  if (identify.name()) traits.name = identify.name();
  // `push` sends it off async
  window.woopra.identify(traits).push();
};

/**
 * Track.
 *
 * @param {Track} track
 */

Woopra.prototype.track = function(track) {
  window.woopra.track(track.event(), stringifyNested(track.properties()));
};

/**
 * Stringify nested objects.
 *
 * Undocumented aspect of Woopra's API, but apparently required. Breaks
 * on `Completed Order` `properties.products`.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function stringifyNested(obj) {
  return foldl(function(results, value, key) {
    if (is.array(obj[key])) {
      results[key] = json.stringify(obj[key]);
    } else {
      results[key] = obj[key];
    }
    return results;
  }, {}, obj);
}
