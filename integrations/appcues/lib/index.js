'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var isObject = require('isobject');
var load = require('@segment/load-script');

/**
 * Expose `Appcues` integration.
 */

var Appcues = integration('Appcues')
  .global('Appcues')
  .option('appcuesId', '');

/**
 * Initialize.
 *
 * http://appcues.com/docs/
 *
 * @api public
 */

Appcues.prototype.initialize = function() {
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Appcues.prototype.loaded = function() {
  return isObject(window.Appcues);
};

/**
 * Load the Appcues library.
 *
 * @api private
 * @param {Function} callback
 */

Appcues.prototype.load = function(callback) {
  var id = this.options.appcuesId || 'appcues';
  load('//fast.appcues.com/' + id + '.js', callback);
};

/**
 * Page.
 *
 * http://appcues.com/docs#page
 *
 * @api public
 * @param {Page} page
 */

Appcues.prototype.page = function(page) {
  window.Appcues.page(page.name(), page.properties());
};

/**
 * Identify.
 *
 * http://appcues.com/docs#identify
 *
 * @api public
 * @param {Identify} identify
 */

Appcues.prototype.identify = function(identify) {
  window.Appcues.identify(identify.userId(), identify.traits());
};

/**
 * Track.
 *
 * http://appcues.com/docs#track
 *
 * @api public
 * @param {Track} track
 */

Appcues.prototype.track = function(track) {
  window.Appcues.track(track.event(), track.properties());
};

/**
 * Expose plugin.
 */

// FIXME(ndhoule): Is this still necessary? I believe this API was deprecated
module.exports = exports = function(analytics) {
  analytics.addIntegration(Appcues);
};

exports.Integration = Appcues;
