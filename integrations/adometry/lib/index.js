'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

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
  var aliases = {
    ...this.options.aliases,
    ...TRACK_SPECIAL_PROPERTIES
  };
  var properties = track.properties(aliases);

  var filteredProperties = pick(Object.values(aliases), properties);

  placementIds.forEach(placementId => {
    self.load('track', {
      advertiserId: self.options.advertiserId,
      campaignId: self.options.campaignId,
      placementId: placementId,
      properties: self._hashify(filteredProperties, 'cus.')
    });
  })
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
  props = Object.entries(props || {});

  if (!props || !props.length) {
    return '';
  }

  return (
    ';' +
    props.map(function(prop) {
      return prefix + prop[0] + ':' + prop[1];
    }).join(';')
  );
};

function pick(props, o) {
  const keys = Object.keys(o).filter(k => props.includes(k))
  const ret = {}

  keys.forEach(k => {
    ret[k] = o[k]
  })

  return ret
}