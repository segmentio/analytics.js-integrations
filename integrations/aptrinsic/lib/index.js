'use strict';

/**
 * Module dependencies.
 */

var Group = require('segmentio-facade').Group;
var Identify = require('segmentio-facade').Identify;
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Aptrinsic` integration.
 */
var Aptrinsic = module.exports = integration('Aptrinsic')
  .global('aptrinsic')
  .option('apiKey', '')
  .tag('<script src="https://web-sdk.aptrinsic.com/api/aptrinsic.js?a={{ apiKey }}">');

/**
 * Initialize.
 *
 * @api public
 */
Aptrinsic.prototype.initialize = function() {
  var apiKey = this.options.apiKey;
  window.aptrinsic = window.aptrinsic || function() {
    window.aptrinsic.q = window.aptrinsic.q || [];
    window.aptrinsic.q.push(arguments);
  };
  window.aptrinsic.p = apiKey;
  this.load(this.ready);
};


/**
 * The context for this integration.
 */

var integrationContext = {
  name: 'aptrinsic-segment',
  version: '1.0.0'
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */
Aptrinsic.prototype.loaded = function() {
  return !!window.aptrinsic;
};

/**
 * Identify.
 *
 * @param {Facade} identify
 */
Aptrinsic.prototype.identify = function(identify) {
  var group = this.analytics.group();  // Current group in segment.analytics
  var identifyGroup = new Group({
    groupId: group.id(),
    traits: group.traits()
  });
  _identify(identify, identifyGroup);
};

/**
 * Group.
 *
 * @param {Facade} group
 */
Aptrinsic.prototype.group = function(group) {
  var user = this.analytics.user(); // Current user in segment.analytics
  var identify = new Identify({
    userId: user.id(),
    traits: user.traits()
  });
  _identify(identify, group);
};

/**
 * Track.
 *
 * @api public
 * @param {Facade} track
 */
Aptrinsic.prototype.track = function(track) {
  window.aptrinsic('event', track.event(), track.properties(), integrationContext);
};

function _identify(user, group) {
  window.aptrinsic('identify', user, group, integrationContext);
}
