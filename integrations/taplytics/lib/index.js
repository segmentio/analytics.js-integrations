'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var is = require('is');
var keys = require('@ndhoule/keys');
var push = require('global-queue')('_tlq');

/**
 * Expose `Taplytics` integration.
 */

var Taplytics = module.exports = integration('Taplytics')
  .global('_tlq')
  .global('Taplytics')
  .option('apiKey', '')
  .option('options', {})
  .tag('<script id="taplytics" src="//cdn.taplytics.com/taplytics.min.js">')
  .assumesPageview();

/**
 * Initialize Taplytics.
 *
 * @api public
 */

Taplytics.prototype.initialize = function() {
  var options = this.options.options;
  var apiKey = this.options.apiKey;

  window._tlq = window._tlq || [];

  push('init', apiKey, options);

  this.load(this.ready);
};

/**
 * Has the Taplytics library been loaded yet?
 *
 * @api private
 * @return {boolean}
 */

Taplytics.prototype.loaded = function() {
  return window.Taplytics && is.object(window.Taplytics._in);
};

/**
 * Identify.
 *
 * @api public
 * @param {Facade} identify
 */

Taplytics.prototype.identify = function(identify) {
  var userId = identify.userId();
  var attrs = identify.traits() || {};

  if (userId) attrs.id = userId;

  if (keys(attrs).length) {
    push('identify', attrs);
  }
};

/**
 * Group.
 *
 * @api public
 * @param {Facade} group
 */

Taplytics.prototype.group = function(group) {
  var attrs = {};
  var groupId = group.groupId();
  var traits = group.traits();
  var user = this.analytics.user();
  var userId = user.id();

  if (groupId) attrs.groupId = groupId;
  if (traits) attrs.groupTraits = traits;
  if (userId) attrs.id = userId;

  if (keys(attrs).length) push('identify', attrs);
};

/**
 * Track.
 *
 * @api public
 * @param {Facade} track
 */

Taplytics.prototype.track = function(track) {
  var properties = track.properties() || {};
  var total = track.revenue() || track.total() || 0;

  push('track', track.event(), total, properties);
};

/**
* Page.
*
* @api public
* @param {Facade} page
*/

Taplytics.prototype.page = function(page) {
  var category = page.category() || undefined;
  var name = page.fullName() || undefined;
  var properties = page.properties() || {};

  push('page', category, name, properties);
};

/**
* Reset a user and log them out.
*
* @api private
*/

Taplytics.prototype.reset = function() {
  push('reset');
};
