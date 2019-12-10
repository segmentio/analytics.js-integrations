
'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var uncase = require('to-no-case');
var foldl = require('@ndhoule/foldl');
var Identify = require('segmentio-facade').Identify;

/**
 * Expose `Outbound` integration.
 */

var Outbound = module.exports = integration('Outbound')
  .global('outbound')
  .option('publicApiKey', '')
  .option('trackReferrer', false)
  .tag('<script src="//cdn.outbound.io/{{ publicApiKey }}.js">');

/**
 * Initialize.
 *
 * @api public
 */

Outbound.prototype.initialize = function() {
  window.outbound = window.outbound || [];
  window.outbound.methods = [
    'identify',
    'track',
    'alias',
    'registerApnsToken',
    'registerGcmToken',
    'disableApnsToken',
    'disableGcmToken',
    'disableAllGcmTokens',
    'disableAllApnsTokens',
    'unsubscribeAll',
    'unsubscribeCampaigns',
    'subscribeAll',
    'subscribeCampaigns',
    'hasIdentified'
  ];

  window.outbound.factory = function(method) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(method);
      window.outbound.push(args);
      return window.outbound;
    };
  };

  for (var i = 0; i < window.outbound.methods.length; i++) {
    var key = window.outbound.methods[i];
    window.outbound[key] = window.outbound.factory(key);
  }

  this.load(this.ready);
};

/**
* Loaded
*
* @api private
* @return {boolean}
*/

Outbound.prototype.loaded = function() {
  return !!(window.outbound && window.outbound.reset);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Outbound.prototype.identify = function(identify) {
  var specialTraits = {
    id: true,
    email: true,
    phone: true,
    'user id': true,
    'last name': true,
    'first name': true
  };

  var userId = identify.userId() || identify.anonymousId();

  var attributes = foldl(function(acc, val, key) {
    if (!specialTraits.hasOwnProperty(uncase(key))) acc.attributes[key] = val;
    return acc;
  }, {
    attributes: {},
    email: identify.email(),
    phoneNumber: identify.phone(),
    firstName: identify.firstName(),
    lastName: identify.lastName()
  }, identify.traits());

  window.outbound.identify(userId, attributes);
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Outbound.prototype.track = function(track) {
  if (!window.outbound.hasIdentified()) {
    var user = new Identify({ userId: track.userId() || track.anonymousId() });
    this.identify(user);
  }
  window.outbound.track(track.event(), track.properties(), track.timestamp());
};

/**
 * Alias.
 *
 * @api public
 * @param {Alias} alias
 */

Outbound.prototype.alias = function(alias) {
  window.outbound.identify(alias.userId(), { previousId: alias.previousId() });
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */
Outbound.prototype.page = function(page) {
  var props = page.properties();
  var evtName = '[Segment Page]';

  if (!this.options.trackReferrer) {
    delete props.referrer;
  }

  if (props.name || props.url) {
    evtName += ' ' + props.name || props.url;
  }

  if (!window.outbound.hasIdentified()) {
    var user = new Identify({ userId: page.userId() || page.anonymousId() });
    this.identify(user);
  }

  window.outbound.track(evtName, props, page.timestamp());
};