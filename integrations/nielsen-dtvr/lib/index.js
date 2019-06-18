'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var reject = require('reject');

/**
 * Expose `NielsenDTVR` integration.
 */

var NielsenDTVR = (module.exports = integration('Nielsen DTVR')
  .option('appId', '')
  .option('sfcode', '')
  .option('optout', false)
  .option('debug', false)
);

/**
 * Initialize.
 * 
 * @api public
 */

NielsenDTVR.prototype.initialize = function() {
  this.ID3 = undefined

  var config = {};
  // debug mode
  if (!this.options.sfCode) config.nol_sdkDebug = 'debug';
  this._client = window.NOLBUNDLE.nlsQ(
    this.options.appId,
    this.options.instanceName,
    config
  );

  this.load(this.ready);
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
  const metadata = mapVideo(track)
  this._client.ggPM('loadMetadata', metadata)
  this.sendID3(track)
};

/**
 * Video Content Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoContentCompleted = function(track) {
  this.end(track)
};

/**
 * Video Ad Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoAdStarted = function(track) {
  const metadata = mapAd(track)
  this._client.ggPM('loadMetadata', metadata)
  sendID3(track)
};

/**
 * Video Ad Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoAdCompleted = function(track) {
  this.end(track)
};

/**
 * Video Playback Interrupted
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackInterrupted = function(track) {
  this.sendID3(track)
};

/**
 * Video Playback Seek Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackSeekStarted = function(track) {
  this.sendID3(track)
};

/**
 * Video Playback Seek Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackSeekCompleted = function(track) {
  const metadata = mapVideo(track)
  this._client.ggPM('loadMetadata', metadata)
  this.sendID3(track)
};

/**
 * Video Playback Buffer Started
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackBufferStarted = function(track) {
  this.sendID3(track)
};

/**
 * Video Playback Buffer Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackBufferCompleted = function(track) {
  const metadata = mapVideo(track)
  this._client.ggPM('loadMetadata', metadata)
  this.sendID3(track)
};

/**
 * Video Playback Paused
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackPaused = function(track) {
  this.sendID3(track)
};

/**
 * Video Playback Resumed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackResumed = function(track) {
  const metadata = mapVideo(track)
  this._client.ggPM('loadMetadata', metadata)
  sendID3(track)
};

/**
 * Video Playback Completed
 *
 * @api public
 */

NielsenDTVR.prototype.videoPlaybackCompleted = function(track) {
  this.end(track)
};

/**
 * Send ID3 tags to Nielsen
 *
 * @api private
 */

NielsenDTVR.prototype.sendId3 = function(event) {
  const options = event.options('Nielsen DTVR')

  if (!options) return
  if (!options.ID3) return
  
  if (!this.ID3) {
    this.ID3 = options.ID3
    this._client.ggPM('sendID3', this.ID3);
  } else if (this.ID3 !== options.ID3) {
    this.ID3 = options.ID3
    // we'll only send ID3 tags if we detect they've been updated
    this._client.ggPM('sendID3', this.ID3);
  }
};

/**
 * End playback
 *
 * @api private
 */

NielsenDTVR.prototype.end = function(event) {
  const livestream = event.proxy('properties.livestream')
  const position = event.proxy('properties.position')
  let time
  if (livestream) {
    time = Math.floor(new Date().getUTCDate()) / 1000
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

function mapVideo(event) {
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

function mapAd(event) {
  return reject({
    type: event.proxy('properties.type'),
    asset_id: event.proxy('properties.assetId') || event.proxy('properties.asset_id')
  })
}
