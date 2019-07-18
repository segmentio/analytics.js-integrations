'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var find = require('obj-case').find;
var reject = require('reject');

/**
 * Expose `NielsenDCR` integration.
 */

var NielsenDCR = (module.exports = integration('Nielsen DCR')
  .option('appId', '')
  .option('instanceName', '') // the snippet lets you override the instance so make sure you don't have any global window props w same value as this setting unless you are intentionally doing that.
  .option('nolDevDebug', false)
  .option('assetIdPropertyName', 'asset_id')
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
 * https://engineeringportal.nielsen.com/docs/DCR_Video_Browser_SDK
 * @api public
 */

NielsenDCR.prototype.initialize = function() {
  var protocol =
    window.location.protocol === 'https:' ||
    window.location.protocol === 'chrome-extension:'
      ? 'https'
      : 'http';
  var config = {};

  /* eslint-disable */
  !function(t,n)
  {
  t[n]=t[n]||
  {
    nlsQ:function(e,o,c,r,s,i)
    {
     return t[n][o]=t[n][o]||{g:c||{},
     ggPM:function(e,c,r,s,i){(t[n][o].q=t[n][o].q||[]).push([e,c,r,s,i])}},t[n][o]
    }
  }
}
  (window,"NOLBUNDLE");
  /* eslint-enable */

  // debug mode
  if (this.options.nolDevDebug) config.nol_sdkDebug = 'debug';
  if (this.options.optout) config.optout = true;
  this._client = window.NOLBUNDLE.nlsQ(
    this.options.appId,
    this.options.instanceName,
    config
  );
  // we will need to keep our own state of the playhead position mapped to its corresponding assetId
  // for the currently viewing ad or content so that we can handle video switches in the same session
  this.currentAssetId = null;
  this.currentPosition = null;
  this.heartbeatId = null; // reference to setTimeout we will need to kill them
  this.load(protocol, this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

NielsenDCR.prototype.loaded = function() {
  return this._client && typeof this._client.ggPM === 'function';
};

/**
 * Page
 *
 * Static measurement (not video spec)
 * https://engineeringportal.nielsen.com/docs/DCR_Static_Browser_SDK_(6.0.0)
 */

NielsenDCR.prototype.page = function(page) {
  var integrationOpts = page.options(this.name);
  var staticMetadata = reject({
    type: 'static',
    assetid: page.url(), // *DYNAMIC METADATA*: unique ID for each article **REQUIRED**
    section: page.fullName() || page.name() || page.event(), // *DYNAMIC METADATA*: section of site **REQUIRED**
    segA: integrationOpts.segA, // *DYNAMIC METADATA*: custom segment
    segB: integrationOpts.segB, // *DYNAMIC METADATA*: custom segment
    segC: integrationOpts.segC // *DYNAMIC METADATA*: custom segment
  });

  this._client.ggPM('staticstart', staticMetadata);
};

/**
 * Nielsen Heartbeat Counter
 * We need to send the playhead position every 1 second
 */

NielsenDCR.prototype.heartbeat = function(assetId, position, options) {
  var self = this;
  var newPosition;
  var opts = options || {};
  try {
    if (typeof position !== 'number') newPosition = parseInt(position, 10); // in case it is sent as a string
  } catch (e) {
    // if we can't parse position into an Int for some reason, early return
    // to prevent internal errors every second
    return;
  }

  if (!this.currentAssetId) this.currentAssetId = assetId;

  // if position is passed in we should override the state of the current playhead position with the explicit position given from the customer
  this.currentPosition = newPosition;

  // Segment expects our own heartbeats every 10 seconds, so we're adding 5 seconds of potential redundancy for buffer
  // for a total of 15 heartbeats
  // we also need to map the current position to the asset id to handle content/ad changes during the same playback session
  var limit = this.currentPosition + 15;
  this.heartbeatId = setInterval(function() {
    // if livestream, you need to send current UTC timestamp
    if (opts.type === 'content' && opts.livestream) {
      self.currentPosition = new Date(opts.timestamp);
      var currentTime = self.currentPosition;
      // for livestream, properties.position is a negative integer representing offset in seconds from current time
      currentTime.setSeconds(currentTime.getSeconds() + newPosition);
      self._client.ggPM('setPlayheadPosition', +Date.now(currentTime)); // UTC
      // increment timestamp by 1 second
      currentTime.setSeconds(currentTime.getSeconds() + 1);
    } else if (newPosition < limit) {
      self._client.ggPM('setPlayheadPosition', self.currentPosition);
      // increment playhead by 1 second
      self.currentPosition++;
    }
  }, 1000);
};

/**
 * Get video content metadata from track event
 *
 * @api private
 */

NielsenDCR.prototype.getContentMetadata = function(track, type) {
  var properties = 'properties.';
  if (type && type === 'preroll') properties = 'properties.content.';

  var integrationOpts = track.options(this.name);
  var contentMetadata = {
    type: 'content',
    assetid: getAssetId(track, this.options.assetIdPropertyName, type),
    program: track.proxy(properties + 'program'),
    title: track.proxy(properties + 'title'),
    // hardcode 86400 if livestream ¯\_(ツ)_/¯
    length: track.proxy(properties + 'livestream')
      ? 86400
      : track.proxy(properties + 'total_length'),
    isfullepisode: track.proxy(properties + 'full_episode') ? 'y' : 'n',
    mediaURL: track.proxy('context.page.url'),
    airdate: track.proxy(properties + 'airdate'),
    // below metadata fields must all be set in event's integrations opts object
    adloadtype: find(integrationOpts, 'ad_load_type') === 'linear' ? '1' : '2', // or dynamic. linear means original ads that were broadcasted with tv airing. much less common use case
    crossId1: find(integrationOpts, 'crossId1'),
    crossId2: find(integrationOpts, 'crossId2'),
    hasAds: find(integrationOpts, 'hasAds') === true ? '1' : '0'
  };

  // optional: used for grouping data into different buckets
  var segB = find(integrationOpts, 'segB');
  var segC = find(integrationOpts, 'segC');
  if (segB) contentMetadata.segB = segB;
  if (segC) contentMetadata.segC = segC;

  return reject(contentMetadata);
};

/**
 * Get ad content metadata from track event
 *
 * @api private
 */

NielsenDCR.prototype.getAdMetadata = function(track) {
  var type = track.proxy('properties.type');
  var adMetadata;
  var assetId = getAssetId(track, this.options.assetIdPropertyName);

  if (typeof type === 'string') type = type.replace('-', '');

  adMetadata = {
    assetid: track.proxy('ad_asset_id') || assetId,
    type: type
  };
  return adMetadata;
};

/**
 * Video Content Started
 *
 * @api public
 */

NielsenDCR.prototype.videoContentStarted = function(track) {
  clearInterval(this.heartbeatId);
  var contentMetadata = this.getContentMetadata(track);

  // Nielsen requires that you call `end` if you need to load new content during the same session.
  // Since we always keep track of the current last seen asset to the instance, if this event has a different assetId, we assume that it is content switch during the same session
  // Segment video spec states that if you are switching between videos, you should be properly calling this event at the start of each of those switches (ie. two video players on the same page), meaning we only have to check this for this event
  if (this.currentAssetId && this.currentAssetId !== contentMetadata.assetid) {
    this._client.ggPM('end', this.currentPosition);
  }

  this._client.ggPM('loadMetadata', contentMetadata);
  this.heartbeat(contentMetadata.assetid, track.proxy('properties.position'), {
    type: 'content',
    livestream: track.proxy('properties.livestream'),
    timestamp: track.timestamp()
  });
};

/**
 * Video Content Playing
 *
 * @api public
 */

NielsenDCR.prototype.videoContentPlaying = function(track) {
  clearInterval(this.heartbeatId);

  var assetId = getAssetId(track, this.options.assetIdPropertyName);
  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');

  this.heartbeat(assetId, position, {
    type: 'content',
    livestream: livestream,
    timestamp: track.timestamp()
  });
};

/**
 * Video Content Completed
 *
 * @api public
 */

NielsenDCR.prototype.videoContentCompleted = function(track) {
  clearInterval(this.heartbeatId);

  // for livestream just send the current utc timestamp
  var timestamp = track.timestamp();
  var livestream = track.proxy('properties.livestream');
  var position = livestream
    ? +Date.now(timestamp)
    : track.proxy('properties.position');

  this._client.ggPM('setPlayheadPosition', position);
  this._client.ggPM('end', position);
};

/**
 * Video Ad Started
 *
 * @api public
 */

NielsenDCR.prototype.videoAdStarted = function(track) {
  clearInterval(this.heartbeatId);

  var adAssetId = getAssetId(track, this.options.assetIdPropertyName);
  var position = track.proxy('properties.position');
  var type = track.proxy('properties.type');
  if (typeof type === 'string') type = type.replace('-', '');
  // edge case: if pre-roll, you must load the content metadata first
  // because nielsen ties ad attribution to the content not playback session
  if (type === 'preroll') {
    this._client.ggPM('loadMetadata', this.getContentMetadata(track, type));
  }

  var adMetadata = {
    assetid: adAssetId,
    type: type
  };

  this._client.ggPM('loadMetadata', adMetadata);
  this.heartbeat(adAssetId, position, { type: 'ad' });
};

/**
 * Video Ad Playing
 *
 * @api public
 */

NielsenDCR.prototype.videoAdPlaying = function(track) {
  clearInterval(this.heartbeatId);

  var assetId = getAssetId(track, this.options.assetIdPropertyName);
  var position = track.proxy('properties.position');
  this.heartbeat(assetId, position, { type: 'ad' });
};

/**
 * Video Ad Completed
 *
 * @api public
 */

NielsenDCR.prototype.videoAdCompleted = function(track) {
  clearInterval(this.heartbeatId);

  var position = track.proxy('properties.position');
  this._client.ggPM('setPlayheadPosition', position);
  this._client.ggPM('stop', position);
};

/**
 * Video Playback Interrupted
 *
 * @api public
 */

NielsenDCR.prototype.videoPlaybackInterrupted = function(track) {
  clearInterval(this.heartbeatId);

  // if properly implemented, the point in which the playback is resumed
  // you should _only_ be sending the asset_id of whatever you are pausing in: content or ad
  var adAssetId = track.proxy('properties.ad_asset_id');
  // if playback was interrupted during an ad, we only call `stop`
  // if interrupted during content play, we call both `end` and `stop`
  var position = track.proxy('properties.position');
  if (adAssetId) return this._client.ggPM('stop', position);

  this._client.ggPM('end', position);
  this._client.ggPM('stop', position);
};

/**
 * Video Playback Seek Completed
 *
 * @api public
 */

NielsenDCR.prototype.videoPlaybackSeekCompleted = function(track) {
  clearInterval(this.heartbeatId);

  var contentAssetId = track.proxy('properties.content_asset_id');
  var adAssetId = track.proxy('properties.ad_asset_id');
  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');
  // if properly implemented, the point in which the playback is resumed
  // you should _only_ be sending the asset_id of whatever you are pausing in: content or ad
  var assetId = contentAssetId || adAssetId;
  var type = contentAssetId ? 'content' : 'ad';

  if (this.currentAssetId && this.currentAssetId !== assetId) {
    if (type === 'ad') {
      this._client.ggPM('loadMetadata', this.getAdMetadata(track));
    } else if (type === 'content') {
      this._client.ggPM('loadMetadata', this.getContentMetadata(track));
    }
  }

  this.heartbeat(assetId, position, {
    type: type,
    livestream: livestream,
    timestamp: track.timestamp()
  });
};

/**
 * Video Playback Paused
 *
 * @api public
 */

NielsenDCR.prototype.videoPlaybackPaused = function(track) {
  clearInterval(this.heartbeatId);
  // NOTE: docs say to just pause the pings but Nielsen Reps say to call `stop`
  this._client.ggPM('stop', track.proxy('properties.position'));
};

/**
 * Video Playback Resumed
 *
 * @api public
 */

NielsenDCR.prototype.videoPlaybackResumed = function(track) {
  clearInterval(this.heartbeatId);

  var contentAssetId = track.proxy('properties.content_asset_id');
  var adAssetId = track.proxy('properties.ad_asset_id');
  var position = track.proxy('properties.position');
  // if properly implemented, the point in which the playback is resumed
  // you should _only_ be sending the asset_id of whatever you are resuming in: content or ad
  var type = contentAssetId ? 'content' : 'ad';
  var assetId = contentAssetId || adAssetId;

  if (this.currentAssetId && this.currentAssetId !== assetId) {
    if (type === 'ad') {
      this._client.ggPM('loadMetadata', this.getAdMetadata(track));
    } else if (type === 'content') {
      this._client.ggPM('loadMetadata', this.getContentMetadata(track));
    }
  }

  this.heartbeat(assetId, position, { type: type });
};

/**
 * Video Playback Completed
 *
 * @api public
 */

NielsenDCR.prototype.videoPlaybackCompleted = function(track) {
  clearInterval(this.heartbeatId);

  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');

  // for livestream just send the current utc timestamp
  if (livestream) position = +Date.now(track.timestamp());

  this._client.ggPM('setPlayheadPosition', position);
  this._client.ggPM('stop', position);

  // reset state
  this.currentPosition = null;
  this.currentAssetId = null;
  this.heartbeatId = null;
};

/**
 * Get Asset ID
 *
 * @param {Track} track
 * @return {string}
 * @api private
 */

function getAssetId(track, customAssetId, type) {
  var assetIdValue;
  var properties = 'properties.';
  if (customAssetId !== 'asset_id') {
    assetIdValue = track.proxy(properties + customAssetId);
  } else if (type === 'preroll') {
    properties = 'properties.content.';
    assetIdValue = track.proxy(properties + 'asset_id');
  } else {
    assetIdValue = track.proxy(properties + 'asset_id');
  }
  return assetIdValue;
}
