'use strict';

/**
 * Module dependencies.
 */

var each = require('@ndhoule/each');
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_aaq');

/**
 * Expose `Evergage` integration.
 */

var Evergage = module.exports = integration('Evergage')
  .assumesPageview()
  .global('_aaq')
  .option('account', '')
  .option('dataset', '')
  .tag('<script src="//cdn.evergage.com/beacon/{{ account }}/{{ dataset }}/scripts/evergage.min.js">');

/**
 * Initialize.
 *
 * @api public
 */

Evergage.prototype.initialize = function() {
  var account = this.options.account;
  var dataset = this.options.dataset;

  window._aaq = window._aaq || [];
  push('setEvergageAccount', account);
  push('setDataset', dataset);
  push('setUseSiteConfig', true);

  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Evergage.prototype.loaded = function() {
  return !!window._aaq;
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Evergage.prototype.page = function(page) {
  var props = page.properties();
  var name = page.name();
  if (name) push('namePage', name);

  each(function(value, key) {
    push('setCustomField', key, value, 'page');
  }, props);

  window.Evergage.init(true);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Evergage.prototype.identify = function(identify) {
  var id = identify.userId();
  if (!id) return;

  push('setUser', id);

  var traits = identify.traits({
    email: 'userEmail',
    name: 'userName'
  });

  each(function(value, key) {
    push('setUserField', key, value, 'page');
  }, traits);
};

/**
 * Group.
 *
 * @api public
 * @param {Group} group
 */

Evergage.prototype.group = function(group) {
  var props = group.traits();
  var id = group.groupId();
  if (!id) return;

  push('setCompany', id);
  each(function(value, key) {
    push('setAccountField', key, value, 'page');
  }, props);
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Evergage.prototype.track = function(track) {
  push('trackAction', track.event(), track.properties());
};
