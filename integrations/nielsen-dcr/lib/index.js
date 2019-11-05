'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var find = require('obj-case').find;
var reject = require('reject');
var dateformat = require('dateformat');

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

  // we need to map the current position to the asset id to handle content/ad changes during the same playback session
  if (!this.currentAssetId) this.currentAssetId = assetId;

  if (livestream) {
    // for livestream events, we calculate a unix timestamp based on the current time an offset value, which should be passed in properties.position
    this.currentPosition = getOffsetTime(position);
  } else if (position) {
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
  var integrationOpts = track.options(this.name);
  var contentMetadata = {
    type: 'content',
    assetid: assetId,
    program: track.proxy(propertiesPath + 'program'),
    title: track.proxy(propertiesPath + 'title'),
    isfullepisode: track.proxy(propertiesPath + 'full_episode') ? 'y' : 'n',
    mediaURL: track.proxy('context.page.url'),
    airdate: formatAirdate(track.proxy(propertiesPath + 'airdate')),
    // `adLoadType` may be set in int opts, falling back to `load_type` property per our video spec
    adloadtype: formatLoadType(
      integrationOpts,
      track.proxy(propertiesPath + 'load_type')
    ),
    // below metadata fields must all be set in event's integrations opts object
    crossId1: find(integrationOpts, 'crossId1'),
    crossId2: find(integrationOpts, 'crossId2'),
    hasAds: find(integrationOpts, 'hasAds') === true ? '1' : '0'
  };

  if (this.options.contentLengthPropertyName !== 'total_length') {
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
  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');

  // Nielsen requires that you call `end` if you need to load new content during the same session.
  // Since we always keep track of the current last seen asset to the instance, if this event has a different assetId, we assume that it is content switch during the same session
  // Segment video spec states that if you are switching between videos, you should be properly calling this event at the start of each of those switches (ie. two video players on the same page), meaning we only have to check this for this event
  if (this.currentAssetId && this.currentAssetId !== contentMetadata.assetid) {
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
  clearInterval(this.heartbeatId);

  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');

  if (livestream) position = getOffsetTime(position);

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

  var adAssetId = this.options.adAssetIdPropertyName
    ? track.proxy('properties.' + this.options.adAssetIdPropertyName)
    : track.proxy('properties.asset_id');
  var position = track.proxy('properties.position');
  var type = track.proxy('properties.type');

  if (typeof type === 'string') type = type.replace('-', '');
  // edge case: if pre-roll, you must load the content metadata first
  // because nielsen ties ad attribution to the content not playback session
  if (type === 'preroll') {
    this._client.ggPM(
      'loadMetadata',
      this.getContentMetadata(track, 'contentEvent')
    );
  }

  var adMetadata = {
    assetid: adAssetId,
    type: type || 'ad'
  };

  this._client.ggPM('loadMetadata', adMetadata);
  this.heartbeat(adAssetId, position);
};

/**
 * Video Ad Playing
 *
 * @api public
 */

NielsenDCR.prototype.videoAdPlaying = function(track) {
  clearInterval(this.heartbeatId);

  var assetId = this.options.adAssetIdPropertyName
    ? track.proxy('properties.' + this.options.adAssetIdPropertyName)
    : track.proxy('properties.asset_id');
  var position = track.proxy('properties.position');

  this.heartbeat(assetId, position);
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
 * Video Playback Paused
 * Video Playback Seek Started
 * Video Playback Buffer Started
 *
 * @api public
 */

NielsenDCR.prototype.videoPlaybackPaused = NielsenDCR.prototype.videoPlaybackSeekStarted = NielsenDCR.prototype.videoPlaybackBufferStarted = function(
  track
) {
  clearInterval(this.heartbeatId);

  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');

  if (livestream) position = getOffsetTime(position);

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

  var contentAssetId = this.options.contentAssetIdPropertyName
    ? track.proxy('properties.' + this.options.contentAssetIdPropertyName)
    : track.proxy('properties.content_asset_id');
  var adAssetId = this.options.adAssetIdPropertyName
    ? track.proxy('properties.' + this.options.adAssetIdPropertyName)
    : track.proxy('properties.ad_asset_id');
  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');
  // if properly implemented, the point in which the playback is resumed
  // you should _only_ be sending the asset_id of whatever you are resuming in: content or ad
  var type = contentAssetId ? 'content' : 'ad';
  var assetId = contentAssetId || adAssetId;

  if (this.currentAssetId && this.currentAssetId !== assetId) {
    if (type === 'ad') {
      this._client.ggPM('loadMetadata', this.getAdMetadata(track));
    } else if (type === 'content') {
      this._client.ggPM(
        'loadMetadata',
        this.getContentMetadata(track, 'contentEvent')
      );
    }
  }

  this.heartbeat(assetId, position, livestream);
};

/**
 * Video Playback Completed
 * Video Playback Interrupted
 *
 * @api public
 */

NielsenDCR.prototype.videoPlaybackCompleted = NielsenDCR.prototype.videoPlaybackInterrupted = function(
  track
) {
  clearInterval(this.heartbeatId);

  var position = track.proxy('properties.position');
  var livestream = track.proxy('properties.livestream');

  if (livestream) position = getOffsetTime(position);

  this._client.ggPM('setPlayheadPosition', position);
  this._client.ggPM('end', position);

  // reset state
  this.currentPosition = 0;
  this.currentAssetId = null;
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

function formatLoadType(integrationOpts, loadTypeProperty) {
  var loadType = find(integrationOpts, 'ad_load_type') || loadTypeProperty;
  // linear or dynamic
  // linear means original ads that were broadcasted with tv airing. much less common use case
  loadType = loadType === 'dynamic' ? '2' : '1';
  return loadType;
}

/**
 * Transforms Segment timestamp into Unix date,
 * seconds since epoch, in UTC. This method also
 * handles offsets for livestreams, if applicable.
 *
 * @param {*} position Should be negative int representing livestream offset
 * @returns {Number} Unix timestamp in seconds
 *
 * @api private
 */

function getOffsetTime(position) {
  var date = Math.floor(Date.now() / 1000);
  if (!position) return date;

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
