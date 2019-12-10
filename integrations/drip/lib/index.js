'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var isObject = require('isobject');
var push = require('global-queue')('_dcq');
var each = require('@ndhoule/each');
var find = require('obj-case').find;

/**
 * Expose `Drip` integration.
 */

var Drip = module.exports = integration('Drip')
  .global('_dc')
  .global('_dcq')
  .global('_dcqi')
  .global('_dcs')
  .option('account', '')
  .tag('<script src="//tag.getdrip.com/{{ account }}.js">');

/**
 * Initialize.
 *
 * @api public
 */

Drip.prototype.initialize = function() {
  window._dcq = window._dcq || [];
  window._dcs = window._dcs || {};
  window._dcs.account = this.options.account;
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Drip.prototype.loaded = function() {
  return isObject(window._dc);
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Drip.prototype.track = function(track) {
  var props = format(track.properties());
  var cents = Math.round(track.revenue() * 100);
  if (cents) props.value = cents;

  // removes redundant data
  delete props.revenue;
  push('track', track.event(), props);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Drip.prototype.identify = function(identify) {
  // minimum required trait to identify a user in Drip
  if (!identify.email()) return;

  push('identify', format(identify.traits()));

  // default can be configured in your UI settings
  var dripCampaignId = find(identify.options(this.name), 'campaignId') || this.options.campaignId;

  // you can subscribe users to specific campaigns in Drip
  // https://www.getdrip.com/docs/js-api#subscribe
  if (dripCampaignId) push('subscribe', { campaign_id: dripCampaignId, fields: identify.traits() });
};

/**
 * Format
 * Replaces spaces with underscores
 *
 * @api public
 * @param {Object} obj
 *
 */

function format(obj) {
  var ret = {};
  each(function(value, key) {
    var formattedKey = key.replace(/\s/g, '_');
    ret[formattedKey] = value;
  }, obj);

  return ret;
}
