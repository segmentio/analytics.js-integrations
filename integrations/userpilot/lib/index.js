'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var isObject = require('isobject');
var load = require('@segment/load-script');

/**
 * Expose `Userpilot` integration.
 */

var Userpilot = integration('Userpilot')
  .global('Userpilot')
  .option('appToken', '');

/**
 * Initialize.
 *
 * http://docs.userpilot.com/
 *
 * @api public
 */

Userpilot.prototype.initialize = function() {
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Userpilot.prototype.loaded = function() {
  return isObject(window.userpilot);
};

/**
 * Load the Userpilot library.
 *
 * @api private
 * @param {Function} callback
 */

Userpilot.prototype.load = function(callback) {
  window.userpilotSettings = { token: this.options.appToken };
  load('//js.userpilot.io/sdk/latest.js', callback);
};

/**
 * Page.
 *
 * http://docs.userpilot.com/#page
 *
 * @api public
 * @param {Page} page
 */

Userpilot.prototype.page = function(page) {
  window.userpilot.reload(page.name(), page.properties());
};

/**
 * Identify.
 *
 * http://docs.userpilot.com/#identify
 *
 * @api public
 * @param {Identify} identify
 */

Userpilot.prototype.identify = function(identify) {
  var traits = identify.traits();
  if (traits.createdAt) {
    traits.created_at = traits.createdAt;
    delete traits.createdAt;
  }

  window.userpilot.identify(identify.userId(), traits);
};

/**
 * Track.
 *
 * http://docs.userpilot.com/#track
 *
 * @api group
 * @param {Group} group
 */

Userpilot.prototype.group = function(group) {
  var companyId = group.groupId(),
    traits = group.traits();
  if (window.userpilot.group) window.userpilot.group(companyId, traits);
};

/**
 * Group.
 *
 * http://docs.userpilot.com/#track
 *
 * @api public
 * @param {Track} track
 */

Userpilot.prototype.track = function(track) {
  window.userpilot.track(track.event(), track.properties());
};

/**
 * Expose plugin.
 */

module.exports = exports = function(analytics) {
  analytics.addIntegration(Userpilot);
};

exports.Integration = Userpilot;
