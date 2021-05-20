'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `GTM`.
 */

var GTM = (module.exports = integration('Google Tag Manager')
  .global('google_tag_manager')
  .option('containerId', '')
  .option('environment', '')
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true)
  .option('dataLayerName', '')
  .tag(
    'no-env',
    '<script src="//www.googletagmanager.com/gtm.js?id={{ containerId }}&l={{ dataLayerName }}">'
  )
  .tag(
    'with-env',
    '<script src="//www.googletagmanager.com/gtm.js?id={{ containerId }}&l={{ dataLayerName }}&gtm_preview={{ environment }}">'
  ));

/**
 * Initialize.
 *
 * https://developers.google.com/tag-manager
 *
 * @api public
 */

GTM.prototype.initialize = function() {
  if (!this.options.dataLayerName) {
    // hard-coding default dataLayerName key here to avoid a settings backfill via destinations config service
    this.options.dataLayerName = 'dataLayer';
  }

  window[this.options.dataLayerName] = window[this.options.dataLayerName] || [];
  window[this.options.dataLayerName].push({
    'gtm.start': Number(new Date()),
    event: 'gtm.js'
  });

  if (this.options.environment.length) {
    this.load('with-env', this.options, this.ready);
  } else {
    this.load('no-env', this.options, this.ready);
  }
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

GTM.prototype.loaded = function() {
  return !!(
    window[this.options.dataLayerName] &&
    Array.prototype.push !== window[this.options.dataLayerName].push
  );
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

GTM.prototype.page = function(page) {
  var category = page.category();
  var name = page.fullName();
  var opts = this.options;

  // all
  if (opts.trackAllPages) {
    this.track(page.track());
  }

  // categorized
  if (category && opts.trackCategorizedPages) {
    this.track(page.track(category));
  }

  // named
  if (name && opts.trackNamedPages) {
    this.track(page.track(name));
  }
};

/**
 * Track.
 *
 * https://developers.google.com/tag-manager/devguide#events
 *
 * @api public
 * @param {Track} track
 */

GTM.prototype.track = function(track) {
  var props = track.properties();
  var userId = this.analytics.user().id();
  var anonymousId = this.analytics.user().anonymousId();
  if (userId) props.userId = userId;
  if (anonymousId) props.segmentAnonymousId = anonymousId;
  props.event = track.event();

  window[this.options.dataLayerName].push(props);
};
