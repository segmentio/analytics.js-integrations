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
  var date;
  var time;
  var metadata;
  // Proactively ensure that we call "end" whenever new content
  // starts. Here, we'll catch it if a customer forgets to call a Segment
  // "Completed" event, so we'll end the video for them. `end` is also
  // appropriate during a video "interruption",
  // e.g. if a user is alternating b/w watching two videos on the same page.
  if (this.previousEvent && track !== this.previousEvent) {
    date = this.previousEvent.timestamp();
    if (
      this.previousEvent.proxy('properties.livestream') === true &&
      date instanceof Date
    ) {
      time = this.previousEvent.timestamp().getUTCDate();
    } else if (this.previousEvent.proxy('properties.position')) {
      time = this.previousEvent.proxy('properties.position');
    }
    this.client.ggPM('end', time);
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
 * Video Content Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoContentCompleted = function(track) {
  this.end(track);
};

/**
 * Video Playback Interrupted
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackInterrupted = function(track) {
  this.sendID3(track);
  this.end(track);
};

/**
 * Video Playback Seek Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackSeekStarted = function(track) {
  this.sendID3(track);
  this.end(track);
};

/**
 * Video Playback Seek Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackSeekCompleted = function(track) {
  var metadata = this.mapMetadata(track);
  if (!metadata) return;
  this.client.ggPM('loadMetadata', metadata);
  this.sendID3(track);
};

/**
 * Video Playback Buffer Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackBufferStarted = function(track) {
  this.sendID3(track);
  this.end(track);
};

/**
 * Video Playback Buffer Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackBufferCompleted = function(track) {
  var metadata = this.mapMetadata(track);
  if (!metadata) return;
  this.client.ggPM('loadMetadata', metadata);
  this.sendID3(track);
};

/**
 * Video Playback Paused
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackPaused = function(track) {
  this.sendID3(track);
  this.end(track);
};

/**
 * Video Playback Resumed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackResumed = function(track) {
  var metadata = this.mapMetadata(track);
  if (!metadata) return;
  this.client.ggPM('loadMetadata', metadata);
  this.sendID3(track);
};

/**
 * Video Playback Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackCompleted = function(track) {
  this.end(track);
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
 * End playback
 *
 * @api private
 */

NielsenDTVR.prototype.end = function(event) {
  var livestream = event.proxy('properties.livestream');
  var position = event.proxy('properties.position');
  var time;
  if (livestream) {
    time = Date.now(event.timestamp());
  } else if (position) {
    time = position;
  }

  if (time) {
    this.client.ggPM('end', time);
  }

  this.ID3 = null;
  this.previousEvent = null;
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
  var adModel;
  var loadType =
    event.proxy('properties.loadType') || event.proxy('properties.load_type');

  if (loadType === 'linear') {
    adModel = '1';
  } else if (loadType === 'dynamic') {
    adModel = '2';
  }

  return validate({
    type: 'content',
    channelName: event.proxy('properties.channel'),
    adModel: adModel
  });
};
