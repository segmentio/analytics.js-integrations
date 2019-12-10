'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var when = require('do-when');
var reject = require('reject');
var json = require('json3');
var is = require('is');
var defaults = require('@ndhoule/defaults');

/**
 * Expose `Parsely` integration.
 */

var Parsely = module.exports = integration('Parsely')
  .global('PARSELY')
  .option('apiKey', '')
  .option('dynamicTracking', false)
  .option('trackEvents', false)
  .option('inPixelMetadata', false)
  .tag('<script src="//d1z2jf7jlzjs58.cloudfront.net/p.js">');

/**
 * Initialize.
 */

Parsely.prototype.initialize = function() {
  window.PARSELY = window.PARSELY || {};
  // Set autoload to false to trigger pageviews on deliberate `page calls`
  if (this.options.dynamicTracking) window.PARSELY.autotrack = false;
  var self = this;

  // append the meta tag we need first before JS fires
  var meta = document.createElement('meta');
  meta.id = 'parsely-cfg';
  meta.setAttribute('data-parsely-site', this.options.apiKey);
  var head = document.getElementsByTagName('head')[0];
  if (!head) return;
  head.appendChild(meta);

  this.load(function() {
    when(self.loaded, self.ready);
  });
};

Parsely.prototype.loaded = function() {
  return !!window.PARSELY.beacon;
};

/**
 * Page.
 *
 * Only Invoked if dynamicTracking is enabled (otherwise noop)
 */

Parsely.prototype.page = function(page) {
  if (!this.options.dynamicTracking) return;
  var properties = page.properties();
  var data = {
    url: page.url(),
    urlref: page.referrer(),
    data: properties,
    js: 1
  };

  if (this.options.inPixelMetadata) {
    var aliasedProps = page.properties(this.options.customMapping);
    var metadata = {
      section: aliasedProps.section || page.category(),
      image_url: aliasedProps.image_url || aliasedProps.imageUrl,
      pub_date_tmsp: aliasedProps.pub_date_tmsp || aliasedProps.created,
      title: aliasedProps.title || page.title(),
      tags: aliasedProps.tags,
      authors:  aliasedProps.authors,
      link: aliasedProps.link || page.url(),
      page_type: aliasedProps.page_type || 'post'
    };

    var authors = metadata.authors;
    var tags = metadata.tags;
    if (authors && !is.array(authors)) metadata.authors = [authors];
    if (tags && !is.array(tags)) metadata.tags = [tags];

    // strip any undefined or nulls
    data.metadata = json.stringify(reject(metadata));
  }

  window.PARSELY.beacon.trackPageView(data);
};

/**
 * Track.
 *
 * http://www.parsely.com/help/integration/dynamic/
 */

Parsely.prototype.track = function(track) {
  /**
  * Because Parse.ly has two possible .track() endpoints, we need to
  * use a helper function to alias track calls. This is because we are
  * using spec'd event names/functions. If we call .track() within them,
  * it will trigger an infinite loop wherein the spec'd functions get called
  * continuously. 
  *
  * See here: https://github.com/segmentio/analytics.js-integration/blob/master/lib/protos.js#L355
  */
  return this.trackDynamicEvent(track);
};

/**
 * Parse.ly requires metadata be passed about the video for started AND paused events.
 * Since our video spec does not specify passing any metadata about the video, we need
 * to store it from the videoContentStarted event as a global variable that the 
 * videoPlaybackPaused event can access.
 */

var CURRENT_VIDEO_METADATA = {};

Parsely.prototype.videoContentStarted = function(track) {
  if (window.PARSELY.video) {
    var vidId = track.proxy('properties.assetId');
    var urlOverride = track.proxy('context.page.url');
    var metadata = this.parseVideoMetadata(track);

    CURRENT_VIDEO_METADATA = metadata;

    window.PARSELY.video.trackPlay(vidId, metadata, urlOverride);
  }
  
  return this.trackDynamicEvent(track);
};

Parsely.prototype.videoPlaybackPaused = function(track) {
  if (window.PARSELY.video) {
    var vidId = track.proxy('properties.assetId');
    var urlOverride = track.proxy('context.page.url');
    var metadata = this.parseVideoMetadata(track);

    metadata = defaults(metadata, CURRENT_VIDEO_METADATA);

    window.PARSELY.video.trackPause(vidId, metadata, urlOverride);
  }

  return this.trackDynamicEvent(track);
};

Parsely.prototype.videoPlaybackInterrupted = function(track) {
  if (window.PARSELY.video) {
    var vidId = track.proxy('properties.assetId');
    window.PARSELY.video.reset(vidId);
  }

  return this.trackDynamicEvent(track);
};

Parsely.prototype.trackDynamicEvent = function(track) {
  if (this.options.trackEvents) {
    window.PARSELY.beacon.trackPageView({
      data: track.properties(),
      action: track.event(),
      url: track.proxy('context.page.url'),
      urlref: track.proxy('context.page.referrer'),
      js: 1
    });
  }
};

Parsely.prototype.parseVideoMetadata = function(track) {
  var options = track.options(this.name) || {};
  var authors = track.proxy('properties.publisher');

  if (authors) authors = Array.isArray(authors) ? authors : [authors];

  // https://www.parse.ly/help/integration/video/#video-metadata
  // https://paper.dropbox.com/doc/Segment-Video-Spec-jdrVhQdGo9aUTQ2kMsbnx
  return reject({ 
    title: track.proxy('properties.title'),
    // Fallback on null to avoid NaN trickling through reject.
    pub_date_tmsp: + new Date(track.proxy('properties.airdate')) || null,
    image_url: options.imageUrl,
    section: track.proxy('properties.genre'),
    authors: authors,
    tags: track.proxy('properties.keywords')
  });
};
