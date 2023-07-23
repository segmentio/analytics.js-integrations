'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var { option } = require('@segment/analytics.js-integration/lib/statics');

/**
 * Expose `WalkMe`
 */

var WalkMe = module.exports = integration('WalkMe')
  .assumesPageview()
  .global('walkme')
  .option('walkMeSystemId', '')
  .option('environment', '')
  .option('trackWalkMeEvents', false)
  .option('loadWalkMeInIframe', false)
  .option('integrityHash', '')
  .option('customDirecotry', 'users')
  .tag('<script async="true" src="{{ url }}" crossorigin="" integrity="{{ hash }}">')

/**
 * Initialize WalkMe
 *
 * @param {Facade} page
 */

WalkMe.prototype.initialize = function() {
  window._walkmeConfig = {
    smartLoad: true,
    segmentOptions: this.options
  };

  if (this.options.loadWalkMeInIframe) {
    window.walkme_load_in_iframe = true;
  }

  var env = "/"+(this.options.environment && this.options.environment.toLowerCase());

  if (env === "/" || env === "/production") {
    env = "";
  }

  var _this = this;
  var isSegmentSignalSent = false;
  window.walkme_segment_ready = function() {
    isSegmentSignalSent = true;
    _this.ready();
  };

  var oldWalkMeReady = window.walkme_ready;
  window.walkme_ready = function() {
    oldWalkMeReady && oldWalkMeReady();

    if (!isSegmentSignalSent) {
      _this.ready();
    }
  };

  var sriSuffix = '';
  var walkMeSystemId = this.options.walkMeSystemId.toLowerCase();

  // WalkMe SRI is enabled
  if (this.options.integrityHash) {
    sriSuffix = 'private_';
  }

  var bucket = (this.options.customDirecotry) ? this.options.customDirecotry : 'users';
  var url = 'https://cdn.walkme.com/' + bucket + '/' + walkMeSystemId + env + '/walkme_' + sriSuffix + walkMeSystemId + '_https.js';

  var payload = {
    url,
    hash: this.options.integrityHash
  };

  this.initializeTester(payload);
  this.load(payload);
};

/**
  * Used for testing initialization
  */
WalkMe.prototype.initializeTester = function () {};

/**
 * Has the WalkMe library been loaded yet?
 *
 * @return {Boolean}
 */

WalkMe.prototype.loaded = function () {
  return window._walkmeInternals && window._walkmeInternals.Segment;
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

WalkMe.prototype.identify = function (data) {
  if (window.WalkMeAPI && window.WalkMeAPI.Segment && window.WalkMeAPI.Segment.identify) {
    window.WalkMeAPI.Segment.identify.apply(null, arguments);
  }
  else {
    window._walkmeInternals.Segment.preLoadedData = arguments;
  }
};

WalkMe.prototype.track = function () {
  window.WalkMeAPI && window.WalkMeAPI.Segment && window.WalkMeAPI.Segment.track && window.WalkMeAPI.Segment.track.apply(null, arguments);
};

WalkMe.prototype.reset = function () {
  window._walkMe && window._walkMe.removeWalkMe && window._walkMe.removeWalkMe();
  window.walkme_ready = undefined;
  window._walkmeConfig = undefined;
}
