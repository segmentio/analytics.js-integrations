'use strict';

/**
 * Module dependencies.
 */

var each = require('component-each');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Simplifi`.
 *
 * - Order of the URL parameters is important.
 */

var Simplifi = (module.exports = integration('Simpli.fi')
  .option('advertiserId', '')
  .option('optInSegment', '')
  .option('optOutSegment', '')
  .tag(
    'opt-in',
    '<script src="//i.simpli.fi/dpx.js?cid={{ advertiserId }}&action=100&segment={{ optInSegment }}&m=1"></script>'
  )
  .tag(
    'opt-out',
    '<script src="//i.simpli.fi/dpx.js?cid={{ advertiserId }}&action=101&segment={{ optOutSegment }}&m=1"></script>'
  )
  .tag(
    'conversion',
    '<script src="//i.simpli.fi/dpx.js?cid={{ advertiserId }}&conversion={{ conversionId }}&campaign_id={{ campaignId }}&m=1&tid={{ tid }}&sifi_tuid={{ sifi_tuid }}">'
  )
  .mapping('events'));

/**
 * Loaded.
 *
 * @api public
 * @return {boolean}
 */

Simplifi.prototype.loaded = function() {
  return true;
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Simplifi.prototype.identify = function(identify) {
  if (!identify.userId()) return this.debug('id required');
  this.load('opt-out');
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Simplifi.prototype.page = function() {
  var user = this.analytics.user();
  // opt-in anonymous users.
  // opt-out registered users.
  if (user.id()) {
    this.load('opt-out');
  } else {
    this.load('opt-in');
  }
};

/**
 * Track.
 *
 * @param {Track} track
 */

Simplifi.prototype.track = function(track) {
  var events = this.events(track.event());
  var self = this;
  each(events, function(event) {
    return self.conversion(track, event);
  });
};

/**
 * Tracks a conversion.
 *
 * @param {Track} track
 * @param {Object} event
 */

Simplifi.prototype.conversion = function(track, event) {
  // campaign id defaults to 0 if this conversion event is
  // not tied to any one campaign.
  var campaignId = event.campaignId || 0;

  // then track event.
  this.load('conversion', {
    conversionId: event.conversionId,
    campaignId: campaignId,
    tid: event.tid,
    sifi_tuid: event.sifi_tuid
  });
};
