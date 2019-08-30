'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_kiq');
var when = require('do-when');

/**
 * Expose `Qualaroo` integration.
 */

var Qualaroo = module.exports = integration('Qualaroo')
  .assumesPageview()
  .global('_kiq')
  .option('customerId', '')
  .option('siteToken', '')
  .option('track', false)
  .tag('<script src="https://cl.qualaroo.com/ki.js/{{ customerId }}/{{ siteToken }}.js">');

/**
 * Initialize.
 *
 * @api public
 * @param {Object} page
 */

Qualaroo.prototype.initialize = function() {
  window._kiq = window._kiq || [];
  var loaded = this.loaded;
  var ready = this.ready;
  this.load(function() {
    when(loaded, ready);
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Qualaroo.prototype.loaded = function() {
  return !!(window._kiq && window._kiq.push !== Array.prototype.push);
};

/**
 * Identify.
 *
 * http://help.qualaroo.com/customer/portal/articles/731085-identify-survey-nudge-takers
 * http://help.qualaroo.com/customer/portal/articles/731091-set-additional-user-properties
 *
 * @api public
 * @param {Identify} identify
 */

Qualaroo.prototype.identify = function(identify) {
  var traits = identify.traits();
  var id = identify.userId();
  var email = identify.email();
  if (email) id = email;
  if (id) push('identify', id);
  if (traits) push('set', traits);
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Qualaroo.prototype.track = function(track) {
  if (!this.options.track) return;
  var event = track.event();
  var traits = {};
  traits['Triggered: ' + event] = true;
  this.identify(new Identify({ traits: traits }));
};
