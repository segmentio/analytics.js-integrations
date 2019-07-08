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
  .option('appId', '') //appId
  .option('instanceName', '') // segment-test
  .option('id3Property', 'ID3')
  .option('sendId3Events', [])
  .option('optout', false)
  .option('debug', false) // per Nielsen, customers should NOT enable in a production environment
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
            console.log(t[n][o].q)
          }
        }, t[n][o]
      }
    }
  } (window, 'NOLBUNDLE');

  // empty object to hold more than one Nielsen DTVR SDK instance
  // multiple instances are required if multiple videos are playing on the
  // same page at the same time
  this.clientMap = {};
  this.currentSession;
  this.ID3;
  this.previousEvent;
  this.isAd = false;

  const protocol = useHttps() ? 'https' : 'http';
  const config = {};
  if (this.options.debug) config.nol_sdkDebug = 'debug';

  // we go ahead and instantiate a default video client,but may create more
  // instances later if the customer has mutiple videos playing on the same
  // page at the same time. if a customer does not pass `session_id` with any of
  // their video events, we fall back to using the default Nielsen client
  this.defaultClient = window.NOLBUNDLE.nlsQ(
    this.options.appId,
    this.options.instanceName,
    config
  );
  this._client = this.defaultClient;
  this.clientMap['defaultClient'] = this.defaultClient

  this.load(protocol, this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

NielsenDTVR.prototype.loaded = function() {
  console.log(this._client && typeof this._client.ggPM === 'function')
  return this._client && typeof this._client.ggPM === 'function';
};

/**
 * Track
 *
 * @api public
 */

NielsenDTVR.prototype.track = function(track) {
  console.log('entering generic track event')
  this._createOrUpdateInstance(track).bind(this)

  const videoEvents = {
    'Video Ad Completed': this.videoAdCompleted.bind(this),
    'Video Ad Started': this.videoAdStarted.bind(this),
    'Video Content Completed': this.videoContentCompleted.bind(this),
    'Video Content Started': this.videoContentStarted.bind(this),
    'Video Playback Buffer Completed': this.videoPlaybackBufferCompleted.bind(this),
    'Video Playback Buffer Started': this.videoPlaybackBufferStarted.bind(this),
    'Video Playback Completed': this.videoPlaybackCompleted.bind(this),
    'Video Playback Interrupted': this.videoPlaybackInterrupted.bind(this),
    'Video Playback Paused': this.videoPlaybackPaused.bind(this),
    'Video Playback Resumed': this.videoPlaybackResumed.bind(this),
    'Video Playback Seek Completed': this.videoPlaybackSeekCompleted.bind(this),
    'Video Playback Seek Started': this.videoPlaybackSeekStarted.bind(this)
  }

  if (track.event() in videoEvents) {
    videoEvents[track.event()](track)
  }
};

/**
 * Video Content Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoContentStarted = function(track) {
  console.log('entering video content started', track.event())
  // Proactively ensure that we call "end" on all videos. Here, we'll catch it
  // if a customer forgets to call a Segment "completed" event and end
  // the video for them.
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
  console.log('entering video content completed', track.event())
  this._end(track)
};

/**
 * Video Ad Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoAdStarted = function(track) {
  console.log('entering video ad started', track.event())
  const metadata = this._mapAd(track)
  console.log('video ad started', metadata)
  this._client.ggPM('loadMetadata', metadata)
  this._sendID3(track)
};

/**
 * Video Ad Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoAdCompleted = function(track) {
  console.log('entering video ad completed', track.event())
  this._end(track)
};

/**
 * Video Playback Interrupted
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackInterrupted = function(track) {
  console.log('entering video playback interrupted', track.event())
  this._sendID3(track)
};

/**
 * Video Playback Seek Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackSeekStarted = function(track) {
  console.log('entering video playback seek started', track.event())
  this._sendID3(track)
};

/**
 * Video Playback Seek Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackSeekCompleted = function(track) {
  console.log('entering video playback seek completed', track.event())
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
  console.log('entering video playback buffer started', track.event())
  this._sendID3(track)
};

/**
 * Video Playback Buffer Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackBufferCompleted = function(track) {
  console.log('entering video playback buffer completed', track.event())
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
  console.log('entering video playback paused', track.event())
  this._sendID3(track)
};

/**
 * Video Playback Resumed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackResumed = function(track) {
  console.log('entering video playback resumed', track.event())
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
  console.log('entering video playback completed', track.event())
  this._end(track)
};

/**
 * Create a new instance/change current working Nielsen SDK instance. This step
 * enables Segment to track multiple videos playing on the same page at the
 * same time b/c Nielsen DTVR instances can only track one video at a time.
 *
 * @api private
 */

NielsenDTVR.prototype._createOrUpdateInstance = function(event) {
  console.log('entered create or update instance')
  const currentSession = event.proxy('properties.session_id') || event.proxy('properties.sessionId')
  // if sessions aren't defined, fall back to the default client
  if (!currentSession) return;
  if (currentSession === this.currentSession) return;

  const config = {}
  if (this.options.debug) config.nol_sdkDebug = 'debug';

  const clients = Object.keys(this.clientMap)
  const thisClient = clients.indexOf(currentSession)

  if (thisClient > -1) {
    this._client = this.clientMap.currentSession
  } else {
    this.clientMap.currentSession = window.NOLBUNDLE.nlsQ(
        this.options.appId,
        this.options.instanceName,
        config
      );

    this._client = this.clientMap.currentSession;
  }
  this.currentSession = currentSession;
  console.log('the current session is', this.currentSession)
  console.log('the current client is', this._client)
}


/**
 * Send ID3 tags to Nielsen
 *
 * @api private
 */

NielsenDTVR.prototype._sendID3 = function(event) {
  console.log('entering send ID3 method', event.event())
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
      console.log('sending this id 3 tag', this.ID3)
      this._client.ggPM('sendID3', this.ID3);
    } else if (id3Tags !== this.ID3) {
      console.log('send this id 3 tag', this.ID3)
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
  console.log('entering end playback method', event.event())
  const livestream = event.proxy('properties.livestream')
  const position = event.proxy('properties.position')
  let time
  if (livestream) {
    console.log(event.timestamp().getUTCDate())
    time = Date.now(event.timestamp())
  } else if (position) {
    time = position
  }
  
  this._client.ggPM('end', time)

  // need to define current session
  if (this._client !== this.defaultClient) {
    this._client = null
    delete this.clients.currentSession
  }
};

/**
 * Map video properties
 *
 * @api private
 */

NielsenDTVR.prototype._mapVideo = function(event) {
  console.log('entering map video method', event.event())
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
  console.log('entering map ad event', event.event())
  return reject({
    type: event.proxy('properties.type'),
    asset_id: event.proxy('properties.adAssetId') || event.proxy('properties.ad_asset_id')
  })
}
