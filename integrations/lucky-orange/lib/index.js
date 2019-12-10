'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var integration = require('@segment/analytics.js-integration');
var useHttps = require('use-https');

/**
 * Expose `LuckyOrange` integration.
 */

var LuckyOrange = module.exports = integration('Lucky Orange')
  .assumesPageview()
  .global('_loq')
  .global('__lo_cs_added')
  .global('__wtw_lucky_site_id')
  .global('__wtw_lucky_is_segment_io')
  .global('__wtw_custom_user_data')
  .option('siteId', null)
  .tag('http', '<script src="http://www.luckyorange.com/w.js?{{ cacheBuster }}">')
  .tag('https', '<script src="https://ssl.luckyorange.com/w.js?{{ cacheBuster }}">');

/**
 * Initialize.
 *
 * @api public
 */

LuckyOrange.prototype.initialize = function() {
  if (!window._loq) window._loq = [];
  window.__wtw_lucky_site_id = this.options.siteId;

  var user = this.analytics.user();
  this.identify(new Identify({
    traits: user.traits(),
    userId: user.id()
  }));

  var cacheBuster = Math.floor(new Date().getTime() / 60000);
  var tagName = useHttps() ? 'https' : 'http';
  this.load(tagName, { cacheBuster: cacheBuster }, this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

LuckyOrange.prototype.loaded = function() {
  return !!window.__lo_cs_added;
};

/**
 * Identify.
 *
 * @param {Identify} identify
 */

LuckyOrange.prototype.identify = function(identify) {
  var traits = identify.traits();
  var email = identify.email();
  if (email) traits.email = email;
  var name = identify.name();
  if (name) traits.name = name;
  window.__wtw_custom_user_data = traits;
};
