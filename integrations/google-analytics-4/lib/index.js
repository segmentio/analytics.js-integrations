'use strict';

/**
 * Module dependencies.
 */
var integration = require('@segment/analytics.js-integration');
var reject = require('reject');

/**
 * GA4
 */
var GA4 = (module.exports = integration('Google Analytics 4')
  .global('gtag')
  .global('ga4DataLayer')
  .option('measurementIds', [])
  .option('cookieDomainName', 'auto')
  .option('cookiePrefix', '_ga')
  .option('cookieExpiration', 63072000)
  .option('cookieUpdate', true)
  .option('cookieFlags', '')
  .option('disablePageViewMeasurement', true)
  .option('disableAllAdvertisingFeatures', false)
  .option('disableAdvertisingPersonalization', false)
  .option('disableGoogleAnalytics', false)
  .option('sendUserId', false)
  .option('userProperties', {})
  .option('customEventsAndParameters', [])
  .tag(
    '<script src="//www.googletagmanager.com/gtag/js?id={{ measurementId }}&l=ga4DataLayer">'
  ));

/**
 * Initialize.
 *
 * https://developers.google.com/analytics/devguides/collection/ga4
 *
 * @api public
 */
GA4.prototype.initialize = function() {
  window.ga4DataLayer = window.ga4DataLayer || [];
  window.gtag = function() {
    window.ga4DataLayer.push(arguments);
  };

  /**
   * This line is in all of the gtag examples but is not well documented. Research
   * says that it is is related to deduplication.
   * https://stackoverflow.com/questions/59256532/what-is-the-js-gtags-js-command
   */
  window.gtag('js', new Date());

  var opts = this.options;
  var measurementIds = opts.measurementIds;

  /**
   * Avoid loading and configuring gtag.js if any are true:
   *  - Disable Google Analytics setting is enabled
   *  - No measurement IDs are configured
   */
  if (!measurementIds.length || opts.disableGoogleAnalytics) {
    return;
  }

  var config = {
    /**
     * Disable Automatic Page View Measurement
     * https://developers.google.com/analytics/devguides/collection/ga4/disable-page-view
     */
    send_page_view: !opts.disablePageViewMeasurement,

    /**
     * Cookie Update
     * https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#cookie_update_parameter
     */
    cookie_update: opts.cookieUpdate,

    /**
     * Cookie Domain Name
     * https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#cookie_domain_configuration
     */
    cookie_domain: opts.cookieDomainName,

    /**
     * Cookie Prefix
     * https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#cookie_prefix
     */
    cookie_prefix: opts.cookiePrefix,

    /**
     * Cookie Expiration
     * https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#cookie_expiration
     */
    cookie_expires: opts.cookieExpiration,
  };

  var sets = [
    /**
     * Cookie Flags
     * https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#cookie_flags
     */
    [{ cookie_flags: opts.cookieFlags }],

    /**
     * Disable All Advertising
     * https://developers.google.com/analytics/devguides/collection/ga4/display-features#disable_all_advertising_features
     */
    ['allow_google_signals', !opts.disableAllAdvertisingFeatures],

    /**
     * Disable Advertising Personalization
     * https://developers.google.com/analytics/devguides/collection/ga4/display-features#disable_advertising_personalization
     */
    ['allow_ad_personalization_signals', !opts.disableAdvertisingPersonalization]
  ];

  // Load gtag.js using the first measurement ID, then configure using the `config` commands built above.
  var self = this;
  this.load({ measurementId: measurementIds[0] }, function() {
    /**
     * Measurement IDs.
     * The same configuration information is shared across all measurement IDs.
     * https://developers.google.com/analytics/devguides/collection/ga4#add_an_additional_google_analytics_property_to_an_existing_tag
     */
    for (var i = 0; i < measurementIds.length; i++) {
      window.gtag('config', measurementIds[i], config)

    }

    /**
     * Set persistent values shared across all gtag.js usage.
     * https://developers.google.com/gtagjs/reference/api#set
     */
    for (var i = 0; i < sets.length; i++) {
      window.gtag.apply(null, sets[i]);
    }

    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */
GA4.prototype.loaded = function() {
  return !!(
    window.ga4DataLayer && Array.prototype.push !== window.ga4DataLayer.push
  );
};

/**
 * Identify.
 *
 * @api public
 * @param {Facade.Identify} event
 */
GA4.prototype.identify = function(identify) {
  var opts = this.options;
  var userPropertyMappings = opts.userProperties;

  var userProperties = {};

  // Map all customer-defined user property mappings.
  for (var eventField in userPropertyMappings) {
    if (!userPropertyMappings.hasOwnProperty(eventField)) {
      continue;
    }

    var userProp = userPropertyMappings[eventField];
    var value = identify.proxy(eventField);

    userProperties[userProp] = value;
  }

    /**
     * Map the user_id property the Send User ID setting is enabled. Note that the user ID
     * can be appended as part of the user_properties object instead of being configured by
     * an explicit command.
     * https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#set_user_id
     */
  var userId = identify.userId();
  if (opts.sendUserId && userId) {
    userProperties.user_id = userId;
  }

  if (Object.keys(userProperties).length) {
    window.gtag('set', 'user_properties', userProperties);
  }
};

/**
 * Group
 *
 * @api public
 * @param {Facade.Group} group
 */
GA4.prototype.group = function(group) {
  var props = reject({
    group_id: group.groupId()
  });

  window.gtag('event', 'join_group', props);
};

/**
 * Page
 *
 * @api public
 * @param {Facade.Page} page
 */
GA4.prototype.page = function(page) {
  // If the Disable Page View Measurement setting is set to false then
  // don't handle page calls to avoid duplicate page_view events.
  if (!this.options.disablePageViewMeasurement) {
    return;
  }

  // Track categorized pages setting needed here?

  var props = page.properties();
  var name = page.fullName();

  // var language = ;
  var pageLocation = props.url;
  var pageReferrer = page.referrer();
  var pageTitle = name || props.title;

  window.gtag('event', 'page_view', {
    page_location: pageLocation,
    page_referrer: pageReferrer,
    page_title: pageTitle
  });
};

/**
 * Track
 *
 * @api public
 * @param {Track} track
 */

GA4.prototype.track = function(track) {

  var mappings = this.options.customEventsAndParameters;

  for (var i = 0; i < mappings.length; i++) {
    var mapping = mappings[i]; // Type check for object?
    var segmentEvent = mapping.segmentEvent;
    var googleEvent = mapping.googleEvent;
  
    if (!segmentEvent || !googleEvent || segmentEvent !== track.event()) {
      continue;
    }

    var parameterMappings = mapping.parameters || []; // Type check for array?
    var parameters = {};

    // Map Segment event fields to Google Event Parameters.
    // Text map settings that are nested in a mixed settings take on a different shape
    // than a top-level text map setting.
    // eg; [{ key: 'properties.genre', value: 'primary_genre }]
    //
    for (var j = 0; j < parameterMappings.length; j++) {
      var map = parameterMappings[j] || {}; // Type check for object?
      if (!map.key || !map.value) {
        continue;
      }

      var param = map.value;
      var value = track.proxy(map.key);
      parameters[param] = value;
    }

    window.gtag('event', googleEvent, reject(parameters));
  }
};
