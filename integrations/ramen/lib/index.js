'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var convertDates = require('@segment/convert-dates');
var del = require('obj-case').del;
var alias = require('@segment/alias');


/**
 * Expose `Ramen` integration.
 */

var Ramen = module.exports = integration('Ramen')
  .global('Ramen')
  .global('_ramen')
  .option('organization_id', '')
  .tag('<script src="//cdn.ramen.is/assets/ramen.js">');

/**
 * Initialize.
 *
 * @api public
 */

Ramen.prototype.initialize = function() {
  window._ramen = window._ramen || [];
  /* eslint-disable */
  (function(){var a,b,c; a = function(f){return function(){window._ramen.push([f].concat(Array.prototype.slice.call(arguments,0))); }; }; b = ["boot","ready","identify","group","track","page","reset","ask"]; for (c = 0; c < b.length; c++) {window._ramen[b[c]] = a(b[c]); } })();
  /* eslint-enable */
  window._ramen.boot(this.options.organization_id, this.options);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Ramen.prototype.loaded = function() {
  return !!(window._ramen && window._ramen.push !== Array.prototype.push);
};

/**
 * Group.
 *
 * @api public
 * @param {Group} group
 */

Ramen.prototype.group = function(group) {
  if (!this.identified) {
    window._ramen.identify();
    this.identified = true;
  }

  var props = group.traits({ createdAt: 'created', created: 'created_at' });
  if (group.groupId()) props.id = group.groupId();

  window._ramen.group(props);
};

/**
 * Page.
 *
 * @api public
 */

Ramen.prototype.page = function() {
  if (!this.identified) {
    window._ramen.identify();
    this.identified = true;
  }

  window._ramen.page();
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Ramen.prototype.track = function(track) {
  if (!this.identified) {
    window._ramen.identify();
    this.identified = true;
  }

  window._ramen.track(track.event());
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Ramen.prototype.identify = function(identify) {
  // Ramen requires that `identify`'d users have an `id`.
  // For anonymous visitors, simply do not call `analytics.identify`
  // and the rest of the integration will handle it.
  if (!identify.userId()) return;

  var user;
  var traits;
  var opts;

  traits = identify.traits();
  opts = identify.options(this.name);

  // Setup the basic `user` attributes: id, email, created_at, and name
  // `null` values are OK. Ramen will ignore them.

  user = { id: identify.userId() };

  if (traits.email) {
    user.email = traits.email;
  }

  if (identify.created()) {
    user.created_at = identify.created();
  }

  if (identify.name()) {
    user.name = identify.name();
  }

  if (traits.company && traits.company.id) {
    user.company = alias(traits.company, { createdAt: 'created', created: 'created_at' });
  }

  // Clear out Ramen-specific values from traits, set traits to equal
  // `user.traits`
  del(traits, 'email');
  del(traits, 'name');
  del(traits, 'id');
  del(traits, 'created');
  del(traits, 'createdAt');
  del(traits, 'company');
  user.traits = traits;

  // Convert all timestamps to epoch seconds
  user = convertDates(user, function(date) { return Math.floor(date / 1000); });

  user.traits = alias(user.traits, { createdAt: 'created' });
  user.traits = alias(user.traits, { created: 'created_at' });

  // Rename `auth_hash_timestamp` to `timestamp` for secure mode
  opts = alias(opts, { auth_hash_timestamp: 'timestamp' });

  window._ramen.identify(user, opts);
  this.identified = true;
};
