'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var qs = require('component-querystring');
var foldl = require('@ndhoule/foldl');
var each = require('component-each');
var toNoCase = require('to-no-case');

/**
 * Expose `MediaMath`
 */

var MediaMath = (module.exports = integration('MediaMath')
  .option('allPagesMtId', '')
  .option('allPagesMtAdId', '')
  .option('events', [])
  .tag(
    'page',
    '<script src="//pixel.mathtag.com/event/js?mt_id={{ allPagesMtId }}&mt_adid={{ allPagesMtAdId }}&v1=&v2=&v3=&s1=&s2=&s3=">'
  )
  .tag(
    'conversion',
    '<script src="//pixel.mathtag.com/event/js?{{ query }}">'
  ));

/**
 * Initialize.
 *
 * @api public
 */

MediaMath.prototype.initialize = function() {
  var allPagesMtId = this.options.allPagesMtId;
  var allPagesMtAdId = this.options.allPagesMtAdId;
  if (allPagesMtId && allPagesMtAdId) this.load('page');
  this.ready();
};

/**
 * Loaded.
 *
 * @api public
 * @return {boolean}
 */

MediaMath.prototype.loaded = function() {
  // MediaMath loads pixels on demand, so it doesn't need to be pre-loaded
  return true;
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

MediaMath.prototype.track = function(track) {
  var events = [];
  if (!this.options.events || !this.options.events.length) return;

  // retrieve event mappings that match the current event
  for (var i = 0; i < this.options.events.length; i++) {
    var item = this.options.events[i];
    if (item.value) {
      if (toNoCase(item.key) === toNoCase(track.event()))
        events.push(item.value);
    } else if (toNoCase(item.event) === toNoCase(track.event())) {
      events.push(item);
    }
  }
  var self = this;
  each(events, function(event) {
    // sParams and vParams are arbitrarily separated,
    // any of either can be assigned any dynamic value.
    var queryParamPropertyMap = [].concat(
      event.vParameters || [],
      event.sParameters || []
    );

    // front-load query accumulator with empty string defaults
    // so that resulting qs will be formatted correctly
    // without omission of mandatory keys (&v1=&v2=&v3=&s1=&s2=&s3=)
    var query = foldl(
      function(query, kv) {
        var property = kv && kv.key;
        var mappedKey = kv && kv.value;
        if (!(property && mappedKey)) return query;

        var value;
        if (property === 'revenue') {
          value = (track.revenue() || 0).toFixed(2);
        } else {
          value = track.proxy('properties.' + property);
        }

        if (value !== undefined && value !== null) {
          query[mappedKey] = value;
        }

        return query;
      },
      {
        mt_id: event.mtId || '',
        mt_adid: event.mtAdId || '',
        v1: '',
        v2: '',
        v3: '',
        s1: '',
        s2: '',
        s3: ''
      },
      queryParamPropertyMap
    );

    self.load('conversion', { query: qs.stringify(query) });
  });
};
