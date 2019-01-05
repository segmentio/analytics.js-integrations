'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var del = require('obj-case').del;
var each = require('@ndhoule/each');
var when = require('do-when');
var reject = require('reject');
var find = require('obj-case').find;

/**
 * Expose `MoEngage` integration.
 */

var MoEngage = module.exports = integration('MoEngage')
  .option('apiKey', '')
  .option('debugMode', false)
  .tag('<script src="https://cdn.moengage.com/webpush/moe_webSdk.min.latest.js">');

/**
 * Initialize.
 *
 * @api public
 */

MoEngage.prototype.initialize = function() {
  var self = this;
  // @hankim - modified this shim to use `t`, `q`, `f`, and `k` as closed variables to abide by strict mode
  /* eslint-disable */
  (function(i, s, o, g, r, a, m, n) {
    i['moengage_object'] = r;
    i['moengage_q'] = []; // @hankim added this since without this it means that this queue is created without having to wait for one of their methods
    var t = {};
    var q = function(f) {
      return function() {
        (i['moengage_q'] = i['moengage_q'] || []).push({
          f: f,
          a: arguments
        });
      };
    };
    var f = ['track_event', 'add_user_attribute', 'add_first_name', 'add_last_name', 'add_email', 'add_mobile',
    'add_user_name', 'add_gender', 'add_birthday', 'destroy_session', 'add_unique_user_id', 'moe_events', 'call_web_push', 'track'
    ];
    for (var k in f) {
      t[f[k]] = q(f[k]);
    }
    i['moe'] = i['moe'] || function() {
      n = arguments[0];
      return t;
    };
  })(window, document, 'script', null, 'Moengage');
  /* eslint-enable */

  this.load(function() {
    when(self.loaded, function() {
      self._client = window.moe({
        app_id: self.options.apiKey,
        debug_logs: self.options.debugMode ? 1 : 0
      });
      // we need to store the current anonymousId for later use in `.identify()` to check if it's a new/existing user
      self.initializedAnonymousId = self.analytics.user().anonymousId();
      self.ready();
    });
  });
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

MoEngage.prototype.loaded = function() {
  return !!window.moeBannerText;
};

/**
 * Identify
 *
 * @api public
 */

MoEngage.prototype.identify = function(identify) {
  var self = this;
  // Important: MoEngage require you to manually call reset to wipe the unique id for the session
  // if you don't do this and call add_unique_user_id w/ a different userId, it will overwrite the previous user's
  // unique id and all their traits so we need to manually check if it's a new user since `analytics.reset()` is not
  // mapped for ajs integrations
  // analytics.js regenerates anonymousId if you call `.identify()` with a unique userId value different from the cache
  if (this.initializedAnonymousId !== identify.anonymousId()) this._client.destroy_session();
  if (identify.userId()) this._client.add_unique_user_id(identify.userId());

  // send common traits
  // the partner sdk throws TypeErrors/Uncaughts if you pass `undefined`
  var traitsMethodMap = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'mobile',
    name: 'user_name',
    username: 'user_name',
    gender: 'gender',
    birthday: 'birthday',
    id: null // just to delete this from identify.traits()
  };
  var traits = reject(identify.traits()); // strip undefined/null

  each(function(value, key) {
    // handle username and name especially
    if (key === 'name') {
      // MoEngage asked to map `name` to `add_user_name` for their existing user base
      if (identify.name()) self._client.add_user_name(identify.name());
      if (identify.name() && identify.username()) return self._client.add_user_attribute('username', identify.username()); // if they are sending `traits.name` as a semantic trait, there's no other way to get username other than as a custom user attribute
    }
    // check if there are sendable semantic traits
    if (find(traitsMethodMap, key)) {
      var method = 'add_' + traitsMethodMap[key];
      var trait = identify[key]();
      self._client[method](trait);
    }
  }, traits);

  // send custom traits so remove all semantic traits
  each(function(value, key) {
    del(traits, key);
  }, traitsMethodMap);

  each(function(value, key) {
    self._client.add_user_attribute(key, value);
  }, traits);
};

/**
 * Track
 *
 * @api public
 */

MoEngage.prototype.track = function(track) {
  this._client.track_event(track.event(), track.properties());
};

/**
 * Reset
 *
 * @api public
 */

MoEngage.prototype.reset = function() {
  this._client.destroy_session();
};
