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
  .option('cookieDomainName', '')
  .option('cookiePrefix', '')
  .option('cookieExpiration', 0)
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

  // This line is in all of the gtag examples but is not well documented. Research says
  // says that it is is related to deduplication.
  // https://stackoverflow.com/questions/59256532/what-is-the-js-gtags-js-command
  window.gtag('js', new Date());

  var config = [];
  var opts = this.options;
  var measurementIds = opts.measurementIds;

  // Avoid loading and configuring gtag.js if any are true:
  //   - Disable Google Analytics setting is enabled
  //   - No measurement IDs are configured
  if (!measurementIds.length || opts.disableGoogleAnalytics) {
    return;
  }

  // Measurement IDs
  // https://developers.google.com/analytics/devguides/collection/ga4#add_an_additional_google_analytics_property_to_an_existing_tag
  for (var i = 0; i < measurementIds.length; i++) {
    config.push(['config', measurementIds[i]]);
  }

  // Disable Page View Measurement
  // https://developers.google.com/analytics/devguides/collection/ga4/disable-page-view
  if (opts.disablePageViewMeasurement) {
    for (var i = 0; i < measurementIds.length; i++) {
      config.push([
        'config',
        measurementIds[i],
        {
          send_page_view: false
        }
      ]);
    }
  }

  /**
   * Cookie Settings
   */

  // Cookie Update
  // https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#cookie_update_parameter
  for (var i = 0; i < measurementIds.length; i++) {
    config.push([
      'config',
      measurementIds[i],
      {
        cookie_update: opts.cookieUpdate
      }
    ]);
  }

  // Cookie Domain Name
  // https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#cookie_domain_configuration
  if (opts.cookieDomainName) {
    for (var i = 0; i < measurementIds.length; i++) {
      config.push([
        'config',
        measurementIds[i],
        {
          cookie_domain: opts.cookieDomainName
        }
      ]);
    }
  }

  // Cookie Prefix
  // https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#cookie_prefix
  if (opts.cookiePrefix) {
    for (var i = 0; i < measurementIds.length; i++) {
      config.push([
        'config',
        measurementIds[i],
        {
          cookie_prefix: opts.cookiePrefix
        }
      ]);
    }
  }

  // Cookie Expiration
  // https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#cookie_expiration
  if (opts.cookieExpiration) {
    for (var i = 0; i < measurementIds.length; i++) {
      config.push([
        'config',
        measurementIds[i],
        {
          cookie_expires: opts.cookieExpiration
        }
      ]);
    }
  }

  // Cookie Flags
  // https://developers.google.com/analytics/devguides/collection/ga4/cookies-user-id#cookie_flags
  if (opts.cookieFlags) {
    config.push(['set', { cookie_flags: opts.cookieFlags }]);
  }

  /**
   * Privacy and Advertising Settings
   */

  // Disable All Advertising
  // https://developers.google.com/analytics/devguides/collection/ga4/display-features#disable_all_advertising_features
  if (opts.disableAllAdvertisingFeatures) {
    config.push(['set', 'allow_google_signals', false]);
  }

  // Disable Advertising Personalization
  // https://developers.google.com/analytics/devguides/collection/ga4/display-features#disable_advertising_personalization
  if (opts.disableAdvertisingPersonalization) {
    config.push(['set', 'allow_ad_personalization_signals', false]);
  }

  // Load gtag.js using the first measurement ID, then configure
  // using the `config` commands built above.
  var self = this;
  this.load({ measurementId: measurementIds[0] }, function() {
    for (var i = 0; i < config.length; i++) {
      window.gtag.apply(null, config[i]);
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
    userProperties = userId;
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

  var screenResolution;
  var screenWidth = page.context('screen.width');
  var screenHeight = page.context('screen.height');
  if (screenWidth && screenHeight) {
    screenResolution = screenWidth + 'x' + screenHeight;
  }

  window.gtag('event', 'page_view', {
    page_location: pageLocation,
    page_referrer: pageReferrer,
    page_title: pageTitle,
    screen_resolution: screenResolution
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

    if (!segmentEvent || segmentEvent !== track.event()) {
      continue;
    }

    var googleEvent = mapping.googleEvent;
    var parameterMappings = mapping.parameters || []; // Type check for array?
    var parameters = {};

    // Map Segment event fields to Google Event Parameters.
    // Text map settings that are nested in a mixed settings take on a different shape
    // than a top-level text map setting.
    // eg; [{ key: 'properties.genre', value: 'primary_genre }]
    //
    for (var i = 0; i < parameterMappings.length; i++) {
      var map = parameterMappings[i] || {}; // Type check for object?
      if (!map.key || map.value) {
        continue;
      }

      var param = map.value;
      var value = track.proxy(map.key);
      parameters[param] = value;
    }

    window.gtag('event', googleEvent, reject(parameters));
  }
};
