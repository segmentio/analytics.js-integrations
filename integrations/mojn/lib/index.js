'use strict';

/**
 * Module dependencies.
 */

var bind = require('component-bind');
var integration = require('@segment/analytics.js-integration');
var is = require('is');
var when = require('do-when');

/**
 * Expose `Mojn`
 */

var Mojn = module.exports = integration('Mojn')
  .global('_mojnTrack')
  .option('customerCode', '')
  .option('region', 'eu')
  .option('sync', false)
  .tag('main', '<script src="https://cdn.idtargeting.com/track/{{region}}.js">')
  .tag('custom', '<script src="https://cdn.idtargeting.com/track/{{customerCode}}.js">')
  .tag('identify', '<img width="1" height="1" src="https://matcher.idtargeting.com/identify.gif?cid={{cid}}&_mjnctid={{mjnctid}}">')
  .tag('sync', '<img width="1" height="1" src="http://ho.idtargeting.com/c/{{cid}}?u={{uid}}&_chk">');

/**
 * Initialize.
 *
 * @api public
 * @param {Object} page
 */

Mojn.prototype.initialize = function() {
  window._mojnTrack = window._mojnTrack || [];
  window._mojnTrack.push({ cid: this.options.customerCode });
  var loaded = bind(this, this.loaded);
  var ready = this.ready;
  var self = this;
  this.load('main', function() {
    self.load('custom', function() {
      when(loaded, ready);
    });
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Mojn.prototype.loaded = function() {
  return is.object(window._mojnTrack);
};

/**
 * Identify.
 *
 * @param {Identify} identify
 * @return {Element|undefined}
 */

Mojn.prototype.identify = function(identify) {
  var email = identify.email();
  if (!email) return;

  this.load('identify', { cid: this.options.customerCode, mjnctid: email });
};

/**
 * Track.
 *
 * @api public
 * @param {Track} event
 * @return {string}
 */

Mojn.prototype.track = function(track) {
  var properties = track.properties();
  var revenue = properties.revenue;
  if (!revenue) return;
  var currency = properties.currency || '';
  var conv = currency + revenue;
  window._mojnTrack.push({ conv: conv });
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Mojn.prototype.page = function() {
  if (!this.options.sync) return;
  this.load('sync', { cid: this.options.customerCode, uid: this.analytics.user().anonymousId() });
};
