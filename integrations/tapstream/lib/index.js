'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_tsq');
var slug = require('slug-component');

/**
 * Expose `Tapstream` integration.
 */

var Tapstream = module.exports = integration('Tapstream')
  .assumesPageview()
  .global('_tsq')
  .option('accountName', '')
  .option('trackAllPages', true)
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true)
  .tag('<script src="//cdn.tapstream.com/static/js/tapstream.js">');

/**
 * Initialize.
 *
 * @api public
 */

Tapstream.prototype.initialize = function() {
  window._tsq = window._tsq || [];
  push('setAccountName', this.options.accountName);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Tapstream.prototype.loaded = function() {
  return !!(window._tsq && window._tsq.push !== Array.prototype.push);
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Tapstream.prototype.page = function(page) {
  var category = page.category();
  var opts = this.options;
  var name = page.fullName();

  // all pages
  if (opts.trackAllPages) {
    this.track(page.track());
  }

  // named pages
  if (name && opts.trackNamedPages) {
    this.track(page.track(name));
  }

  // categorized pages
  if (category && opts.trackCategorizedPages) {
    this.track(page.track(category));
  }
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Tapstream.prototype.track = function(track) {
  var props = track.properties();
  // needs events as slugs
  push('fireHit', slug(track.event()), [props.url]);
};
