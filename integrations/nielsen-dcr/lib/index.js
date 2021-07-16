'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var find = require('obj-case').find;
var reject = require('reject');
var dateformat = require('dateformat');
var sha256 = require('js-sha256');

/**
 * Expose `NielsenDCR` integration.
 */

var NielsenDCR = (module.exports = integration('Nielsen DCR')
  .option('appId', '')
  .option('instanceName', '') // the snippet lets you override the instance so make sure you don't have any global window props w same value as this setting unless you are intentionally doing that.
  .option('nolDevDebug', false)
  .option('assetIdPropertyName', '') // deprecated
  .option('contentAssetIdPropertyName', '')
  .option('adAssetIdPropertyName', '')
  .option('subbrandPropertyName', '')
  .option('clientIdPropertyName', '')
  .option('customSectionProperty', '')
  .option('sendCurrentTimeLivestream', false)
  .option('contentLengthPropertyName', 'total_length')
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
  this.currentPosition = 0;
  this.isDCRStream = false;
  this.heartbeatId = null; // reference to setTimeout
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
  var customSectionName;

  //Allow customer to pick property to source section from otherwise fallback on page name
  if (this.options.customSectionProperty) {
    customSectionName = page.proxy(
      'properties.' + this.options.customSectionProperty
    );
  }
  var defaultSectionName = page.fullName() || page.name() || page.event();
  var sectionName = customSectionName || defaultSectionName;
  var url = page.url();

  var staticMetadata = reject({
    type: 'static',
    assetid: sha256(url), // *DYNAMIC METADATA*: unique ID for each article, deterministic SHA256 hash of url since assetid cannot contain special characters **REQUIRED**
    section: sectionName, // *DYNAMIC METADATA*: section of site **REQUIRED**
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

NielsenDCR.prototype.heartbeat = function(assetId, position, livestream) {
  var self = this;
  // if position is not sent as a string
  try {
    if (typeof position !== 'number') {
      position = parseInt(position, 10); /* eslint-disable-line */
    }
  } catch (e) {
    // if we can't parse position into an Int for some reason, early return
    // to prevent internal errors every second
    return;
  }

  // we need to map the current position to the content asset id to handle content changes during the same playback session
  if (assetId && this.currentAssetId !== assetId) {
    this.currentAssetId = assetId;
  }

  if (livestream) {
    // for livestream events, we calculate a unix timestamp based on the current time an offset value, which should be passed in properties.position
    this.currentPosition = getOffsetTime(position, self.options);
  } else if (position >= 0) {
    // this.currentPosition defaults to 0 upon initialization
    this.currentPosition = position;
  }
  this.heartbeatId = setInterval(function() {
    self._client.ggPM('setPlayheadPosition', self.currentPosition);
    self.currentPosition++;
  }, 1000);
};

/**
 * Get video content metadata from track event
 *
 * @api private
 */

NielsenDCR.prototype.getContentMetadata = function(track, type) {
  var propertiesPath = 'properties.';
  if (type && type === 'contentEvent') propertiesPath = 'properties.content.';

  var integrationOpts = track.options(this.name);
  var adLoadType = formatLoadType(integrationOpts, track, propertiesPath);
  // adLoadType will be falsy if the `load_type` is NOT 'dynamic' (i.e. it IS 'linear' instead)
  // we bubble up false to the calling content/playback method so we can early return, as
  // DCR should not be tracking ratings for content of `load_type` 'linear'
  if (!adLoadType) return;
  this.isDCRStream = true;

  var customAssetId;
  if (this.options.contentAssetIdPropertyName) {
    customAssetId = track.proxy(
      propertiesPath + this.options.contentAssetIdPropertyName
    );
  }
  var assetIdProp =
    track.proxy(propertiesPath + 'content_asset_id') ||
    track.proxy(propertiesPath + 'asset_id');
  var assetId = customAssetId || assetIdProp;
  var contentMetadata = {
    type: 'content',
    assetid: assetId,
    program: track.proxy(propertiesPath + 'program'),
    title: track.proxy(propertiesPath + 'title'),
    isfullepisode: track.proxy(propertiesPath + 'full_episode') ? 'y' : 'n',
    mediaURL: track.proxy('context.page.url'),
    airdate: formatAirdate(track.proxy(propertiesPath + 'airdate')),
    adloadtype: adLoadType,
    // below metadata fields must all be set in event's integrations opts object
    crossId1: find(integrationOpts, 'crossId1'),
    crossId2: find(integrationOpts, 'crossId2'),
    hasAds: find(integrationOpts, 'hasAds') === true ? '1' : '0'
  };

  if (this.options.contentLengthPropertyName && this.options.contentLengthPropertyName !== 'total_length') {
    var contentLengthKey = this.options.contentLengthPropertyName;
    contentMetadata.length = track.proxy(propertiesPath + contentLengthKey);
  } else {
    contentMetadata.length = track.proxy(propertiesPath + 'total_length');
  }
  // if length is any falsy value after the above checks, default to 0 length per Nielsen
  contentMetadata.length = contentMetadata.length || 0;

  if (this.options.subbrandPropertyName) {
    var subbrandProp = this.options.subbrandPropertyName;
    contentMetadata.subbrand = track.proxy(propertiesPath + subbrandProp);
  }

  if (this.options.clientIdPropertyName) {
    var clientIdProp = this.options.clientIdPropertyName;
    contentMetadata.clientid = track.proxy(propertiesPath + clientIdProp);
  }

  // optional: used for grouping data into different buckets
  var segB = find(integrationOpts, 'segB');
  var segC = find(integrationOpts, 'segC');
  if (segB) contentMetadata.segB = segB;
  if (segC) contentMetadata.segC = segC;

  return reject(contentMetadata);
};

/**
 * Get ad metadata from track event
 *
 * @api private
 */

NielsenDCR.prototype.getAdMetadata = function(track) {
  var integrationOpts = track.options(this.name);
  var adLoadType = formatLoadType(integrationOpts, track, 'properties');
  if (!adLoadType) return;

  var type = track.proxy('properties.type');
  if (typeof type === 'string') type = type.replace('-', '');

  var customAssetId;
  if (this.options.adAssetIdPropertyName) {
    customAssetId = track.proxy(
      'properties.' + this.options.adAssetIdPropertyName
    );
  }
  var assetIdProp =
    track.proxy('properties.ad_asset_id') || track.proxy('properties.asset_id');
  var assetId = customAssetId || assetIdProp;
  var adMetadata = {
    assetid: assetId,
    type: type || 'ad'
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
  if (!contentMetadata) return;
  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');

  // Nielsen requires that you call `end` if you need to load new content during the same session.
  // Since we always keep track of the current last seen asset to the instance, if this event has a different assetId, we assume that it is content switch during the same session
  // Segment video spec states that if you are switching between videos, you should be properly calling this event at the start of each of those switches (ie. two video players on the same page), meaning we only have to check this for this event
  if (
    this.currentAssetId &&
    contentMetadata.assetid &&
    this.currentAssetId !== contentMetadata.assetid
  ) {
    this._client.ggPM('end', this.currentPosition);
  }

  this._client.ggPM('loadMetadata', contentMetadata);
  this.heartbeat(contentMetadata.assetid, position, livestream);
};

/**
 * Video Content Playing
 *
 * @api public
 */

NielsenDCR.prototype.videoContentPlaying = function(track) {
  clearInterval(this.heartbeatId);
  if (!this.isDCRStream) return;

  var assetId = this.options.contentAssetIdPropertyName
    ? track.proxy('properties.' + this.options.contentAssetIdPropertyName)
    : track.proxy('properties.asset_id');
  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');

  this.heartbeat(assetId, position, livestream);
};

/**
 * Video Content Completed
 *
 * @api public
 */

NielsenDCR.prototype.videoContentCompleted = function(track) {
  var self = this;

  clearInterval(this.heartbeatId);
  if (!this.isDCRStream) return;

  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');

  if (livestream) position = getOffsetTime(position, self.options);

  this._client.ggPM('setPlayheadPosition', position);
  this._client.ggPM('stop', position);
};

/**
 * Video Ad Started
 *
 * @api public
 */

NielsenDCR.prototype.videoAdStarted = function(track) {
  clearInterval(this.heartbeatId);

  var type = track.proxy('properties.type');
  if (typeof type === 'string') type = type.replace('-', '');
  // edge case: if pre-roll, you must load the content metadata first
  // because nielsen ties ad attribution to the content not playback session
  var contentMetadata = {};
  if (type === 'preroll') {
    contentMetadata = this.getContentMetadata(track, 'contentEvent');
    if (!contentMetadata) return;
    this._client.ggPM('loadMetadata', contentMetadata);
  }

  if (!this.isDCRStream) return;

  var adAssetId = this.options.adAssetIdPropertyName
    ? track.proxy('properties.' + this.options.adAssetIdPropertyName)
    : track.proxy('properties.asset_id');
  var position = track.proxy('properties.position');

  var adMetadata = {
    assetid: adAssetId,
    type: type || 'ad'
  };

  this._client.ggPM('loadMetadata', adMetadata);
  // contentMetadata may be an empty object below, but that's ok
  // in this case, the assetId will be passed as `undefined` to the `heartbeat` method, b/c we only
  // need an assetid if a content assetid is set in properties or content.properties
  this.heartbeat(contentMetadata.assetid, position);
};

/**
 * Video Ad Playing
 *
 * @api public
 */

NielsenDCR.prototype.videoAdPlaying = function(track) {
  clearInterval(this.heartbeatId);
  if (!this.isDCRStream) return;

  var position = track.proxy('properties.position');
  // first argument below is "null" b/c `heartbeat` doesn't need to keep track of ad asset ids
  // BUT we do still want to keep track of "position"
  this.heartbeat(null, position);
};

/**
 * Video Ad Completed
 *
 * @api public
 */

NielsenDCR.prototype.videoAdCompleted = function(track) {
  clearInterval(this.heartbeatId);
  if (!this.isDCRStream) return;

  var position = track.proxy('properties.position');

  this._client.ggPM('setPlayheadPosition', position);
  this._client.ggPM('stop', position);
};

/**
 * Video Playback Paused
 * Video Playback Seek Started
 * Video Playback Buffer Started
 * Video Playback Interrupted
 * Video Playback Exited
 *
 * @api public
 */

NielsenDCR.prototype.videoPlaybackPaused = NielsenDCR.prototype.videoPlaybackSeekStarted = NielsenDCR.prototype.videoPlaybackBufferStarted = NielsenDCR.prototype.videoPlaybackInterrupted = NielsenDCR.prototype.videoPlaybackExited = function(
  track
) {
  var self = this;
  clearInterval(this.heartbeatId);
  if (!this.isDCRStream) return;

  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');

  if (livestream) position = getOffsetTime(position, self.options);

  this._client.ggPM('stop', position);
};

/**
 * Video Playback Resumed
 * Video Playback Seek Completed
 * Video Playback Buffer Completed
 *
 * @api public
 */

NielsenDCR.prototype.videoPlaybackResumed = NielsenDCR.prototype.videoPlaybackSeekCompleted = NielsenDCR.prototype.videoPlaybackBufferCompleted = function(
  track
) {
  clearInterval(this.heartbeatId);
  if (!this.isDCRStream) return;

  var contentAssetId = this.options.contentAssetIdPropertyName
    ? track.proxy('properties.' + this.options.contentAssetIdPropertyName)
    : track.proxy('properties.content_asset_id');
  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');
  // if properly implemented, the point in which the playback is resumed
  // you should _only_ be sending the asset_id of whatever you are resuming in: content or ad
  var type = contentAssetId ? 'content' : 'ad';

  if (
    this.currentAssetId &&
    contentAssetId &&
    this.currentAssetId !== contentAssetId
  ) {
    // first, call `end` because we assume the user has buffered/seeked into new content if the assetId has changed
    this._client.ggPM('end', this.currentPosition);

    if (type === 'ad') {
      var adMetadata = this.getAdMetadata(track);
      if (!adMetadata) return;
      this._client.ggPM('loadMetadata', adMetadata);
    } else if (type === 'content') {
      var contentMetadata = this.getContentMetadata(track, 'contentEvent');
      if (!contentMetadata) return;
      this._client.ggPM('loadMetadata', contentMetadata);
    }
  }

  this.heartbeat(contentAssetId, position, livestream);
};

/**
 * Video Playback Completed
 *
 *
 * @api public
 */

NielsenDCR.prototype.videoPlaybackCompleted = function(
  track
) {
  var self = this;
  clearInterval(this.heartbeatId);
  if (!this.isDCRStream) return;

  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');

  if (livestream) position = getOffsetTime(position, self.options);

  this._client.ggPM('setPlayheadPosition', position);
  this._client.ggPM('end', position);

  // reset state because "Video Playback Completed" are "non-recoverable events"
  // e.g. they should always be followed by the start of a new video session with either
  // "Video Content Started" or "Video Ad Started" events
  this.currentPosition = 0;
  this.currentAssetId = null;
  this.isDCRStream = false;
  this.heartbeatId = null;
};

/**
 * Formats airdate property per Nielsen DCR spec.
 * Nielsen DCR requires dates to be in format YYYYMMDD HH:MI:SS
 *
 * @api private
 */

function formatAirdate(airdate) {
  var date;
  try {
    date = dateformat(airdate, 'yyyymmdd hh:MM:ss', true);
  } catch (e) {
    // do nothing with this error for now
  }
  return date;
}

/**
 * Falls back to check `properties.load_type` if
 * `integrationsOpts.ad_load_type` is falsy
 *
 * @api private
 */

function formatLoadType(integrationOpts, track, propertiesPath) {
  var loadType =
    find(integrationOpts, 'ad_load_type') ||
    track.proxy(propertiesPath + 'load_type') ||
    track.proxy(propertiesPath + 'loadType');
  // DCR is meant to track videos with ad `load_type` dynamic only
  // otherwise, we return `false` so we can easily early return in the calling method
  loadType = loadType === 'dynamic' ? '2' : false;
  return loadType;
}

/**
 * Transforms Segment timestamp into Unix date,
 * seconds since epoch, in UTC. This method also
 * handles offsets for livestreams, if applicable.
 *
 * @param {*} position Should be negative int representing livestream offset
 * @param {*} options Integration settings
 * @returns {Number} Unix timestamp in seconds
 *
 * @api private
 */

function getOffsetTime(position, options) {
  var date = Math.floor(Date.now() / 1000);
  if (!position || options.sendCurrentTimeLivestream) return date;

  try {
    if (typeof position !== 'number') {
      position = parseInt(position, 10); /* eslint-disable-line */
    }
  } catch (e) {
    // if we can't parse position into an Int for some reason, simply return
    // the current unix timestamp
    return date;
  }

  return date + position;
}
