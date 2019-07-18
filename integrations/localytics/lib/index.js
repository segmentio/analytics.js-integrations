'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var each = require('component-each');

/**
 * HOP.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Expose `Localytics`
 */

var Localytics = (module.exports = integration('Localytics')
  .assumesPageview()
  .global('LocalyticsGlobal')
  .option('appKey', '')
  .option('namespace', null)
  .option('polling', null)
  .option('appVersion', null)
  .option('networkCarrier', null)
  .option('uploadTimeout', null)
  .option('sessionTimeoutSeconds', null)
  .option('storage', null)
  .option('logger', null)
  .option('trackAllPages', false)
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true)
  .option('dimensions', {})
  .tag('localytics', '<script src="//web.localytics.com/v3/localytics.js">'));

/**
 * Initialize
 *
 * http://www.localytics.com/docs/sdks-integration-guides/web/
 *
 * @api public
 */

Localytics.prototype.initialize = function() {
  var self = this;

  window.LocalyticsGlobal = 'll';
  window.ll =
    window.ll ||
    function() {
      window.ll.q = window.ll.q || [];
      window.ll.q.push(arguments);
    };
  window.ll.t = +new Date();
  window.ll('init', self.options.appKey, {});

  this.load('localytics', this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Localytics.prototype.loaded = function() {
  // FIXME: This will always return true because we init LocalyticsGlobal to a
  // truthy value in #initialize
  return !!window.LocalyticsGlobal;
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Localytics.prototype.identify = function(identify) {
  var id = identify.userId();
  var email = identify.email();
  var name = identify.name();
  var firstName = identify.firstName();
  var lastName = identify.lastName();

  if (id) window.ll('setCustomerId', id);
  if (name) window.ll('setCustomerName', name);
  if (email) window.ll('setCustomerEmail', email);
  if (firstName) window.ll('setCustomerFirstName', firstName);
  if (lastName) window.ll('setCustomerLastName', lastName);
  this.setCustomDimensions(identify.traits());
};

/**
 * Page.
 *
 * http://www.localytics.com/docs/sdks-integration-guides/web/#html5screens
 *
 * @param {Page} page
 */

Localytics.prototype.page = function(page) {
  var category = page.category();
  var name = page.fullName();
  var event = page.event();
  var opts = this.options;
  if (opts.trackAllPages) window.ll('tagScreen', event);
  if (name && opts.trackNamedPages) window.ll('tagScreen', name);
  if (category && opts.trackCategorizedPages) window.ll('tagScreen', category);
};

/**
 * Track.
 *
 * http://docs.localytics.com/dev/web.html#events-web
 *
 * @param {Track} track
 */

Localytics.prototype.track = function(track) {
  this.setCustomDimensions(track.properties());
  var value = track.revenue() || track.value();
  window.ll('tagEvent', track.event(), track.properties(), value);
};

/**
 * Set custom dimensions if call traits/properties match pre-defined settings
 *
 * @param {Object} props
 * @api private
 */

Localytics.prototype.setCustomDimensions = function(props) {
  var opts = this.options.dimensions;
  each(props, function(name, value) {
    if (has.call(opts, name)) {
      window.ll('setCustomDimension', opts[name], value);
    }
  });
};
