'use strict';

// Spec: https://github.com/segmentio/analytics.js-private/issues/79

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var each = require('component-each');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Rockerbox`.
 */

var Rockerbox = (module.exports = integration('Rockerbox')
  .option('source', '')
  .option('allAnSeg', '')
  .option('customerAnSeg', '')
  .option('conversionId', '')
  .option('segmentId', '')
  .mapping('events')
  .tag(
    'page',
    '<script src="https://getrockerbox.com/pixel?source={{ source }}&type=imp&an_seg={{ allAnSeg }}">'
  )
  .tag(
    'user',
    '<script src="https://getrockerbox.com/pixel?source={{ source }}&type=imp&an_seg={{ customerAnSeg }}">'
  )
  .tag(
    'appnexus',
    '<script src="https://secure.adnxs.com/px?id={{ conversionId }}&seg={{ segmentId }}&t=1&order_id={{ id }}">'
  )
  .tag(
    'track',
    '<script src="https://getrockerbox.com/pixel?source={{ source }}&type=conv&id={{ conversionId }}&an_seg={{ segmentId }}&order_type={{ id }}">'
  ));

/**
 * Initialize.
 *
 * @api public
 */

Rockerbox.prototype.initialize = function() {
  this.ready();
};

/**
 * Page.
 *
 * @api public
 */

Rockerbox.prototype.page = function() {
  var user = this.analytics.user();
  // order of query parameters is important
  this.load('page');
  if (user.id()) this.load('user');
};

/**
 * Track.
 *
 * @param {Track} track
 */

Rockerbox.prototype.track = function(track) {
  var user = this.analytics.user();
  var events = this.events(track.event());
  var self = this;

  each(events, function(event) {
    var conversionId = event.conversionId;
    var segmentId = event.segmentId;
    var property = event.property || 'email';
    var id;

    switch (property) {
      case 'email':
        id = user && email(user);
        break;
      case 'orderId':
        id = track.orderId();
        break;
      case 'userId':
        id = user && user.id();
        break;
      case 'revenue':
        id = track.revenue();
        break;
      default:
      // No default case
    }

    var params = {
      conversionId: conversionId,
      segmentId: segmentId,
      id: id
    };

    // load 2 pixels, parameter order is important.
    self.load('appnexus', params);
    self.load('track', params);
  });
};

/**
 * Get email from user.
 *
 * @param {Object} user
 * @return {String}
 */

function email(user) {
  var identify = new Identify({ userId: user.id(), traits: user.traits() });
  return identify.email();
}
