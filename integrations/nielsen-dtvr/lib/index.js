'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `NielsenDTVR` integration.
 */

var NielsenDTVR = (module.exports = integration('Nielsen DTVR')
  .option('appId', '')
  .option('instanceName', '')
  .option('id3Property', 'id3')
  .option('sendId3Events', [])
  .option('debug', false) // per Nielsen, customers should NOT ever enable in a production environment
  .option('optout', false)
  .tag(
    'http',
    '<script src="http://cdn-gl.imrworldwide.com/conf/{{ appId }}.js#name={{ instanceName }}&ns=NOLBUNDLE">'
  )
  .tag(
    'https',
    '<script src="https://cdn-gl.imrworldwide.com/conf/{{ appId }}.js#name={{ instanceName }}&ns=NOLBUNDLE">'
  ));

/**
 * Initialize.
 *
 * @api public
 */

NielsenDTVR.prototype.initialize = function() {
  var protocol =
    window.location.protocol === 'https:' ||
    window.location.protocol === 'chrome-extension:'
      ? 'https'
      : 'http';
  var config = {};
  this.ID3 = null;
  this.previousEvent = null;
  this.isDTVRStream = false;

  // Modified Nielsen snippet. It shouldn't load the Nielsen tag, but it should
  // still successfully queue events fired before the tag loads.

  /* eslint-disable */
  !(function(t, n) {
    t[n] = t[n] || {
      // t = window, n = 'NOLBUNDLE'
      nlsQ: function(e, o, c, r, s, i) {
        // e = appId, o = instanceName, c = config
        return (
          (t[n][o] = t[n][o] || {
            g: c || {},
            ggPM: function(e, c, r, s, i) {
              (t[n][o].q = t[n][o].q || []).push([e, c, r, s, i]);
            }
          }),
          t[n][o]
        );
      }
    };
  })(window, 'NOLBUNDLE');
  /* eslint-enable */

  if (this.options.debug) config.nol_sdkDebug = 'debug';
  if (this.options.optout) config.optout = true;
  this.client = window.NOLBUNDLE.nlsQ(
    this.options.appId,
    this.options.instanceName,
    config
  );

  this.load(protocol, this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

NielsenDTVR.prototype.loaded = function() {
  return this.client && typeof this.client.ggPM === 'function';
};

/**
 * Track
 *
 * @api public
 */

NielsenDTVR.prototype.track = function(track) {
  this.sendID3(track);
};

/**
 * Video Content Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoContentStarted = function(track) {
  var metadata;
  // Proactively ensure we clear the session whenever new content
  // starts. Here, we'll catch it if a customer forgets to call a Segment
  // "Completed" event, so we'll clear the ID3 tags and stream.
  // e.g. if a user is alternating b/w watching two videos on the same page.
  if (this.previousEvent && track !== this.previousEvent) {
    this.ID3 = null;
    this.previousEvent = null;
    this.isDTVRStream = null;
  }

  metadata = this.mapMetadata(track);
  if (!metadata) return;
  this.client.ggPM('loadMetadata', metadata);
  this.sendID3(track);
  // We need to store the previous event in memory b/c in some situations we
  // need access to the previous event's properties
  this.previousEvent = track;
};

/**
 * These are considered non-recoverable completion scenarios. 
 * Nielsen has requested we do not fire anything for these events.
 * We will simply reset ID3 tags and clear out the stream/session.
 * 
 * Video Content Completed
 * Video Playback Completed
 * Video Playback Exited
 *
 * @api public
 */

NielsenDTVR.prototype.videoContentCompleted = NielsenDTVR.prototype.videoPlaybackCompleted = NielsenDTVR.prototype.videoPlaybackExited = function() {
  if (!this.isDTVRStream) return;
  this.ID3 = null;
  this.previousEvent = null;
  this.isDTVRStream = null;
};

/**
 * These are considered recoverable interruption scenarios.
 * Nielsen has requested we do not fire anything for these events, aside from reporting the latest ID3 tag.
 * 
 * Video Playback Interrupted
 * Video Playback Seek Started
 * Video Playback Buffer Started
 * Video Playback Paused
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackInterrupted = NielsenDTVR.prototype.videoPlaybackSeekStarted = NielsenDTVR.prototype.videoPlaybackBufferStarted = NielsenDTVR.prototype.videoPlaybackPaused = function(
  track
) {
  if (!this.isDTVRStream) return;
  this.sendID3(track);
};

/**
 * Video Playback Seek Completed
 * Video Playback Buffer Completed
 * Video Playback Resumed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackSeekCompleted = NielsenDTVR.prototype.videoPlaybackBufferCompleted = NielsenDTVR.prototype.videoPlaybackResumed = function(
  track
) {
  var metadata = this.mapMetadata(track);
  if (!metadata || !this.isDTVRStream) return;
  this.client.ggPM('loadMetadata', metadata);
  this.sendID3(track);
};

/**
 * Send ID3 tags to Nielsen
 *
 * @api private
 */

NielsenDTVR.prototype.sendID3 = function(event) {
  var id3Events = this.options.sendId3Events;
  var id3Prop;
  var id3Tags;
  var found = false;

  if (id3Events.length <= 0) return;
  for (var i = 0; i < id3Events.length; i += 1) {
    if (id3Events[i] === event.event()) {
      found = true;
      break;
    }
  }
  if (!found) return;

  id3Prop = this.options.id3Property;
  id3Tags = event.proxy('properties.' + id3Prop);
  if (id3Tags) {
    // we'll only send ID3 tags to Nielsen if we detect the customer has either
    // never sent ID3 tags, or if they're different from the previous ID3 tags
    // sent during the session
    if (!this.ID3 || id3Tags !== this.ID3) {
      this.ID3 = id3Tags;
      this.client.ggPM('sendID3', this.ID3);
    }
  }
};

/**
 * Helper to validate that metadata contains required properties, i.e.
 * all values are truthy Strings. We don't need to validate keys b/c
 * we hard-code into the object the metadata keys Nielsen requires.
 *
 * @api private
 */

function validate(metadata) {
  var isValid = true;
  var keys = Object.keys(metadata);
  var key;

  for (var i = 0; i < keys.length; i += 1) {
    key = keys[i];
    if (typeof metadata[key] !== 'string' || metadata[key].length <= 0) {
      isValid = false;
    }
  }

  return isValid ? metadata : false;
}

/**
 * Map video properties
 *
 * @api private
 */

NielsenDTVR.prototype.mapMetadata = function(event) {
  var loadType =
    event.proxy('properties.loadType') ||
    event.proxy('properties.load_type') ||
    event.proxy('properties.content.loadType') ||
    event.proxy('properties.content.load_type');

  // only video streams of load_type "linear" should be mapped to Nielsen DTVR
  // we need to persist the fact that a stream is/isn't a DTVR stream for events
  // that may not contain a `load_type` k:v pair, such as "Video Playback" events
  if (loadType !== 'linear') {
    this.isDTVRStream = false;
    return false;
  }

  this.isDTVRStream = true;

  return validate({
    type: 'content',
    channelName: event.proxy('properties.channel'),
    adModel: '1'
  });
};
