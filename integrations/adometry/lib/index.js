'use strict';

/**
 * Module dependencies.
 */

var each = require('@ndhoule/each');
var entries = require('@ndhoule/entries');
var extend = require('@ndhoule/extend');
var integration = require('@segment/analytics.js-integration');
var map = require('@ndhoule/map');
var pick = require('@ndhoule/pick');
var values = require('@ndhoule/values');

/**
 * Map of special #track properties to their default Adometry shorthands.
 *
 * https://segment.com/docs/api/tracking/track/#special-properties
 */

var TRACK_SPECIAL_PROPERTIES = {
  revenue: 'rev',
  value: 'val'
};

/**
 * Expose `Adometry`.
 */

var Adometry = (module.exports = integration('Adometry')
  .global('DMTRY')
  .option('advertiserId', '')
  .option('campaignId', '')
  .option('pageId', '')
  .tag(
    'page',
    '<script src="//js.dmtry.com/channel.js#gid:{{ campaignId }};advid:{{ advertiserId }};pid:{{ pageId }}{{ properties }}">'
  )
  .tag(
    'track',
    '<script src="//js.dmtry.com/channel.js#gid:{{ campaignId }};advid:{{ advertiserId }};pid:{{ placementId }}{{ properties }}">'
  )
  .mapping('events')
  .mapping('aliases'));

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Adometry.prototype.track = function(track) {
  var event = track.event();
  if (!event) return;

  var self = this;
  var placementIds = this.events(event);
  var aliases = extend({}, this.options.aliases, TRACK_SPECIAL_PROPERTIES);
  var properties = track.properties(aliases);
  var filteredProperties = pick(values(aliases), properties);

  each(function(placementId) {
    self.load('track', {
      advertiserId: self.options.advertiserId,
      campaignId: self.options.campaignId,
      placementId: placementId,
      properties: self._hashify(filteredProperties, 'cus.')
    });
  }, placementIds);
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Adometry.prototype.page = function(page) {
  var self = this;
  var anonymousId = page.anonymousId();
  var properties = { ano: anonymousId };

  self.load('page', {
    properties: self._hashify(properties, 'cus.')
  });
};

/**
 * Creates an Adometry-compatible hash from an object.
 *
 * @api private
 * @param {object} props A hash of key-value pairs.
 * @param {string} prefix A prefix to add to each key.
 * @return {string}
 */

// TODO: Move into a lib file and test separately once we have multi-file support
Adometry.prototype._hashify = function(props, prefix) {
  prefix = prefix || '';
  props = entries(props);

  if (!props || !props.length) {
    return '';
  }

  return (
    ';' +
    map(function(prop) {
      return prefix + prop[0] + ':' + prop[1];
    }, props).join(';')
  );
};
