'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Bing`.
 *
 * https://bingads.microsoft.com/campaign/signup
 */

var Bing = (module.exports = integration('Bing Ads')
  .global('UET')
  .global('uetq')
  .option('tagId', '')
  .tag('<script src="//bat.bing.com/bat.js">'));

/**
 * Initialize.
 *
 * Inferred from their snippet:
 * https://gist.github.com/sperand-io/8bef4207e9c66e1aa83b
 *
 * @api public
 */

Bing.prototype.initialize = function() {
  window.uetq = window.uetq || [];
  var self = this;

  var consent = {
    ad_storage: self.options.adStorage || 'denied'
  };
  if (self.options.enableConsent) {
    window.uetq.push('consent', 'default', consent);
  }

  self.load(function() {
    var setup = {
      ti: self.options.tagId,
      q: window.uetq
    };

    window.uetq = new window.UET(setup);
    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Bing.prototype.loaded = function() {
  return !!(window.uetq && window.uetq.push !== Array.prototype.push);
};

/**
 * Page.
 *
 * @api public
 */

Bing.prototype.page = function(page) {
  if (this.options.enableConsent) {
    // eslint-disable-next-line no-use-before-define
    updateConsent.call(this, page);
  }
  window.uetq.push('pageLoad');
};

/**
 * Track.
 *
 * Send all events then set goals based
 * on them retroactively: http://advertise.bingads.microsoft.com/en-us/uahelp-topic?market=en&project=Bing_Ads&querytype=topic&query=HLP_BA_PROC_UET.htm
 *
 * @api public
 * @param {Track} track
 */

Bing.prototype.track = function(track) {
  var event = {
    ea: 'track',
    el: track.event()
  };

  if (track.category()) event.ec = track.category();
  if (track.revenue()) event.gv = track.revenue();

  if (this.options.enableConsent) {
    // eslint-disable-next-line no-use-before-define
    updateConsent.call(this, track);
  }

  window.uetq.push(event);
};

function updateConsent(event) {
  var consent = {};

  // If consent category is granted, set it immediately and return
  if (
    this.options.consentSettings.categories &&
    this.options.consentSettings.categories.includes(
      this.options.adStorageConsentCategory
    )
  ) {
    consent.ad_storage = 'granted';
    window.uetq.push('consent', 'update', consent);
    return;
  }

  // Otherwise, try to get ad_storage value from propertiesPath
  var propertiesPath = event.proxy(
    'properties.' + this.options.adStoragePropertyMapping
  );
  if (typeof propertiesPath === 'string') {
    consent.ad_storage = propertiesPath.toLowerCase();
    window.uetq.push('consent', 'update', consent);
  }
}
