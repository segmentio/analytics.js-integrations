'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var reject = require('reject');
var useHttps = require('use-https');

/**
 * Expose `NielsenDTVR` integration.
 */

var NielsenDTVR = (module.exports = integration('Nielsen DTVR')
  .option('appId', '')
  .option('instanceName', '')
  .option('id3Property', 'ID3')
  .option('sendId3Events', [])
  .option('optout', false)
  .option('debug', false) // per Nielsen, customers should NOT ever enable in a production environment
  .tag(
    'http',
    '<script src="http://cdn-gl.imrworldwide.com/conf/{{ appId }}.js#name={{ instanceName }}&ns=NOLBUNDLE">'
  )
  .tag(
    'https',
    '<script src="http:s//cdn-gl.imrworldwide.com/conf/{{ appId }}.js#name={{ instanceName }}&ns=NOLBUNDLE">'
  )
);

/**
 * Initialize.
 * 
 * @api public
 */

NielsenDTVR.prototype.initialize = function() {
  // Modified Nielsen snippet. It shouldn't load the Nielsen tag, but it should
  // still successfully queue events fired before the tag loads.
  !function(t, n) {
    t[n] = t[n] || { // t = window, n = 'NOLBUNDLE'
      nlsQ: function(e, o, c, r, s, i) { // e = appId, o = instanceName, c = config
        return t[n][o] = t[n][o] || {
          g: c || {},
          ggPM: function(e, c, r, s, i) {
            (t[n][o].q = t[n][o].q || []).push([e, c, r, s, i])
          }
        }, t[n][o]
      }
    }
  } (window, 'NOLBUNDLE');

  this.ID3;
  this.previousEvent;
  this.isAd = false;

  const protocol = useHttps() ? 'https' : 'http';
  const config = {};
  if (this.options.debug) config.nol_sdkDebug = 'debug';

  this._client = window.NOLBUNDLE.nlsQ(
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
  return this._client && typeof this._client.ggPM === 'function';
};

/**
 * Video Content Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoContentStarted = function(track) {
  // Proactively ensure that we call "end" whenever new content
  // starts. Here, we'll catch it if a customer forgets to call a Segment 
  // "completed" event, so we'll end the video for them. `end` is also 
  // appropriate during a video interruption,
  // e.g. if a user is alternating b/w watching two videos on the same page.
  if (this.previousEvent && track !== this.previousEvent) {
    let time
    if (this.previousEvent.proxy('properties.livestream') == true) {
      time = this.previousEvent.timestamp().getUTCDate()
    } else if (this.previousEvent.proxy('properties.position')) {
      time = this.previousEvent.proxy('properties.position')
    }
    this._client.ggPM('end', time)
  }
  
  // Every time content begins playing, we assume it's not ad content unless
  // an adAssetId exists in the payload to tell us otherwise. Ads have their
  // own content events.
  this.isAd = false

  const adAssetId = track.proxy('properties.ad_asset_id') || track.proxy('properties.adAssetId')
  if (adAssetId) this.isAd = true
  
  const metadata = this.isAd ? this._mapAd(track) : this._mapVideo(track)
  this._client.ggPM('loadMetadata', JSON.parse(JSON.stringify(metadata)))
  this._sendID3(track)
  // We need to store the previous event in memory b/c in some situations we
  // need access to the previous event's properties
  this.previousEvent = track
};

/**
 * Video Content Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoContentCompleted = function(track) {
  this._end(track)
};

/**
 * Video Ad Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoAdStarted = function(track) {
  const metadata = this._mapAd(track)
  this._client.ggPM('loadMetadata', metadata)
  this._sendID3(track)
};

/**
 * Video Ad Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoAdCompleted = function(track) {
  this._end(track)
};

/**
 * Video Playback Interrupted
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackInterrupted = function(track) {
  this._sendID3(track)
};

/**
 * Video Playback Seek Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackSeekStarted = function(track) {
  this._sendID3(track)
};

/**
 * Video Playback Seek Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackSeekCompleted = function(track) {
  const metadata = this.isAd ? this._mapAd(track) : this._mapVideo(track)
  this._client.ggPM('loadMetadata', metadata)
  this._sendID3(track)
};

/**
 * Video Playback Buffer Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackBufferStarted = function(track) {
  this._sendID3(track)
};

/**
 * Video Playback Buffer Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackBufferCompleted = function(track) {
  const metadata = this.isAd ? this._mapAd(track) : this._mapVideo(track)
  this._client.ggPM('loadMetadata', metadata)
  this._sendID3(track)
};

/**
 * Video Playback Paused
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackPaused = function(track) {
  this._sendID3(track)
};

/**
 * Video Playback Resumed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackResumed = function(track) {
  const metadata = this.isAd ? this._mapAd(track) : this._mapVideo(track)
  this._client.ggPM('loadMetadata', metadata)
  this._sendID3(track)
};

/**
 * Video Playback Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackCompleted = function(track) {
  this._end(track)
};

/**
 * Send ID3 tags to Nielsen
 *
 * @api private
 */

NielsenDTVR.prototype._sendID3 = function(event) {
  const id3Events = this.options.sendId3Events
  if (id3Events.length <= 0) return;
  if (id3Events.length > 0) {
    for (let i = 0; i < id3Events.length; i++) {
      if (id3Events[i] === event.event()) {
        break;
      }
      if (i === id3Events.length - 1) {
        return;
      }
    }
  }

  const id3Prop = this.options.id3Property || 'ID3'
  const id3Tags = event.proxy('properties.' + id3Prop)
  if (id3Tags) {
    // we'll only send ID3 tags to Nielsen if we detect the customer has either
    // never sent ID3 tags, or if they're different from the previous ID3 tags
    // sent during the session
    if (!this.ID3) {
      this.ID3 = id3Tags
      this._client.ggPM('sendID3', this.ID3);
    } else if (id3Tags !== this.ID3) {
      this._client.ggPM('sendID3', this.ID3);
    }
  }
};

/**
 * End playback
 *
 * @api private
 */

NielsenDTVR.prototype._end = function(event) {
  const livestream = event.proxy('properties.livestream')
  const position = event.proxy('properties.position')
  let time
  if (livestream) {
    time = Date.now(event.timestamp())
  } else if (position) {
    time = position
  }
  
  this._client.ggPM('end', time)
};

/**
 * Map video properties
 *
 * @api private
 */

NielsenDTVR.prototype._mapVideo = function(event) {
  let load_type
  let loadTypeVal = event.proxy('properties.load_type') || event.proxy('properties.load_type')

  if (loadTypeVal === 'linear') {
    load_type = '1'
  } else if (loadTypeVal === 'dynamic') {
    load_type = '2'
  }

  return reject({
    type: 'content',
    channelName: event.proxy('properties.channel'),
    load_type
  })
}

/**
 * Map ad properties
 *
 * @api private
 */

NielsenDTVR.prototype._mapAd = function(event) {
  return reject({
    type: event.proxy('properties.type'),
    asset_id: event.proxy('properties.adAssetId') || event.proxy('properties.ad_asset_id')
  })
}
