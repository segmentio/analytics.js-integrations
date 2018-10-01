'use strict';

/**
 * Module dependencies.
 */

var camel = require('camelcase');
var foldl = require('@ndhoule/foldl');
var integration = require('@segment/analytics.js-integration');
var is = require('is');

/**
 * Expose `FullStory` integration.
 *
 * https://www.fullstory.com/docs/developer
 */

var FullStory = (module.exports = integration('FullStory')
  .option('org', '')
  .option('debug', false)
  .option('passEvents', false)
  .tag('<script src="https://www.fullstory.com/s/fs.js"></script>'));

/**
 * Initialize.
 */

FullStory.prototype.initialize = function() {
  window._fs_debug = this.options.debug;
  window._fs_host = 'www.fullstory.com';
  window._fs_org = this.options.org;
  window._fs_namespace = 'FS';

  /* eslint-disable */
  (function(m, n, e, t, l, o, g, y) {
    if (e in m) {
      if (m.console && m.console.log) {
        m.console.log(
          'FullStory namespace conflict. Please set window["_fs_namespace"].'
        );
      }
      return;
    }
    g = m[e] = function(a, b) {
      g.q ? g.q.push([a, b]) : g._api(a, b);
    };
    g.q = [];
    g.identify = function(i, v) {
      g(l, { uid: i });
      if (v) g(l, v);
    };
    g.setUserVars = function(v) {
      g(l, v);
    };
    g.event = function(i, v, s) {
      g('event', { n: i, p: v, s: s });
    };
    g.shutdown = function() {
      g('rec', !1);
    };
    g.restart = function() {
      g('rec', !0);
    };
    g.consent = function(a) {
      g('consent', !arguments.length || a);
    };
    g.identifyAccount = function(i, v) {
      o = 'account';
      v = v || {};
      v.acctId = i;
      g(o, v);
    };
    g.clearUserCookie = function() {};
  })(window, document, window['_fs_namespace'], 'script', 'user');
  /* eslint-enable */

  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */

FullStory.prototype.loaded = function() {
  return !!window.FS;
};

/**
 * Identify.  But, use FS.setUserVars if we only have an anonymous id, keeping the
 * user id unbound until we (hopefully) get a login page or similar and another call
 * to identify with more useful contents.  (This because FullStory doesn't like the
 * user id changing once set.)
 *
 * @param {Identify} identify
 */

FullStory.prototype.identify = function(identify) {
  var traits = identify.traits({ name: 'displayName' });

  var newTraits = foldl(
    function(results, value, key) {
      if (
        value !== null &&
        typeof value === 'object' &&
        value.constructor !== Date
      ) {
        return results;
      }
      if (key !== 'id')
        results[
          key === 'displayName' || key === 'email' ? key : convert(key, value)
        ] = value;
      return results;
    },
    {},
    traits
  );
  if (identify.userId()) {
    window.FS.identify(String(identify.userId()), newTraits);
  } else {
    newTraits.segmentAnonymousId_str = String(identify.anonymousId());
    window.FS.setUserVars(newTraits);
  }
};

/**
 * Track. Passes the events directly to FullStory via FS.event API only when the
 * option passEvents is set to true. passEvents is set to false by default.
 *
 * @param {Track} track
 */

FullStory.prototype.track = function(track) {
  if (this.options.passEvents) {
    window.FS.event(track.event(), track.properties(), "segment");
  }
};

/**
 * Convert to FullStory format.
 *
 * @param {string} trait
 * @param {*} value
 */

function convert(key, value) {
  // Handle already-tagged keys without changing it.  This means both that a
  // user passing avg_spend_real *gets* avg_spend_real not avg_spend_real_real,
  // AND that they get avg_spend_real even if the value happens to be a perfect
  // integer.  (Or a string, although FullStory will flag that as an error.)
  var parts = key.split('_');
  if (parts.length > 1) {
    // If we have an underbar, we have at least 2 parts; check the last as a tag
    var tag = parts.pop();
    if (
      tag === 'str' ||
      tag === 'int' ||
      tag === 'date' ||
      tag === 'real' ||
      tag === 'bool'
    ) {
      return camel(parts.join('_')) + '_' + tag;
    }
  }

  // No tag found, try to infer one from the value.
  key = camel(key);
  if (is.string(value)) return key + '_str';
  if (isInt(value)) return key + '_int';
  if (isFloat(value)) return key + '_real';
  if (is.date(value)) return key + '_date';
  if (is.bool(value)) return key + '_bool';
  return key; // Bad FullStory type, but don't mess with the key so error messages name it
}

/**
 * Check if n is a float.
 */

function isFloat(n) {
  return Number(n) === n && n % 1 !== 0;
}

/**
 * Check if n is an integer.
 */

function isInt(n) {
  return Number(n) === n && n % 1 === 0;
}
