'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var extend = require('@ndhoule/extend');
var integration = require('@segment/analytics.js-integration');
var isObject = require('isobject');

/**
 * Expose `Clicky` integration.
 */

var Clicky = module.exports = integration('Clicky')
  .assumesPageview()
  .global('clicky')
  .global('clicky_site_ids')
  .global('clicky_custom')
  .option('siteId', null)
  .tag('<script src="//static.getclicky.com/js"></script>');

/**
 * Initialize.
 *
 * http://clicky.com/help/customization
 *
 * @api public
 */

Clicky.prototype.initialize = function() {
  var user = this.analytics.user();
  window.clicky_site_ids = window.clicky_site_ids || [this.options.siteId];
  this.identify(new Identify({
    userId: user.id(),
    traits: user.traits()
  }));
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Clicky.prototype.loaded = function() {
  return isObject(window.clicky);
};

/**
 * Page.
 *
 * http://clicky.com/help/customization#/help/custom/manual
 *
 * @api public
 * @param {Page} page
 */

Clicky.prototype.page = function(page) {
  var properties = page.properties();
  var name = page.fullName();
  window.clicky.log(properties.path, name || properties.title);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} [id]
 */

Clicky.prototype.identify = function(identify) {
  window.clicky_custom = window.clicky_custom || {};
  window.clicky_custom.session = window.clicky_custom.session || {};
  var traits = identify.traits();

  var username = identify.username();
  var email = identify.email();
  var name = identify.name();

  if (username || email || name) traits.username = username || email || name;

  extend(window.clicky_custom.session, traits);
};

/**
 * Track.
 *
 * http://clicky.com/help/customization#/help/custom/manual
 *
 * @api public
 * @param {Track} event
 */

Clicky.prototype.track = function(track) {
  window.clicky.goal(track.event(), track.revenue());
};
