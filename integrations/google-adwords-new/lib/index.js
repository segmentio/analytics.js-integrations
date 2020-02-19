'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var each = require('@ndhoule/each');
var find = require('obj-case');
var reject = require('reject');
var extend = require('extend');

/**
 * Expose `GoogleAdWordsNew` integration.
 */

var GoogleAdWordsNew = (module.exports = integration('Google AdWords New')
  .option('accountId', '')
  .option('sendPageView', true)
  .option('conversionLinker', true)
  .option('clickConversions', [])
  .option('pageLoadConversions', [])
  .option('defaultPageConversion', '')
  .option('disableAdPersonalization', false)
  // The ID in this line (i.e. the gtag.js ID) does not determine which account(s) will receive data from the tag; rather, it is used to uniquely identify your global site tag. Which account(s) receive data from the tag is determined by calling the config command (and by using the send_to parameter on an event). For instance, if you use Google Analytics, you may already have the gtag.js global site tag installed on your site. In that case, the gtag.js ID may be that of the Google Analytics property where you first obtained the snippet.
  .tag(
    '<script src="https://www.googletagmanager.com/gtag/js?id={{ accountId }}">'
  ));

/**
 * Initialize.
 *
 * https://support.google.com/adwords/answer/6095821?hl=en&ref_topic=3165803
 * @api public
 */

GoogleAdWordsNew.prototype.initialize = function() {
  var self = this;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };

  var config = {};
  if (this.options.sendPageView === false)
    config.send_page_view = this.options.sendPageView;
  if (this.options.conversionLinker === false)
    config.conversion_linker = this.options.conversionLinker; // not recommended to set this by GA docs — less accurate measurements

  this.load(function() {
    window.gtag('js', new Date());

    // ad personalization must be disabled before any 'config' statements
    // https://support.google.com/analytics/answer/9050852?hl=en
    if (self.options.disableAdPersonalization)
      window.gtag('set', 'allow_ad_personalization_signals', false);

    window.gtag('config', self.options.accountId, config);
    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

GoogleAdWordsNew.prototype.loaded = function() {
  return window.dataLayer.push !== Array.prototype.push;
};

/**
 * Page
 *
 * https://support.google.com/adwords/answer/6095821?hl=en&ref_topic=3165803
 * @api public
 */

GoogleAdWordsNew.prototype.page = function(page) {
  var self = this;
  // If there is no pageName, we support firing default Page Load conversion if provided in options
  var configs = this.options;
  var pageName = page.name();
  // If you are naming your `.page()` calls, you should explicitly map each one rather than expecting a fallback to default page conversion
  if (!pageName && configs.defaultPageConversion)
    return sendPageLoadConversion(configs.defaultPageConversion);

  // A mapped event can either be a 'Page Load' or a 'Click' conversion in AdWords.
  // Since the Page Load conversions are meant to just be dropped on a given page, we are mapping named page calls rather than `.track()`
  var mappedConversions = matchConversion(
    this.options.pageLoadConversions,
    pageName
  );

  each(function(mappedConversion) {
    sendPageLoadConversion(mappedConversion.id, mappedConversion.override);
  }, mappedConversions);

  function sendPageLoadConversion(id, override) {
    var semanticMetadata = reject({
      send_to: (override || configs.accountId) + '/' + id,
      // the below are not spec'd props of page API, AdWords accepts can accept them for this type of conversions
      value: page.options(self.name).value,
      currency: page.options(self.name).currency,
      transaction_id: find(page.options(self.name), 'order_id')
    });
    var metadata = extend(page.properties(), semanticMetadata);
    // metadata shouldn't contain PII — warning by Google
    return window.gtag('event', pageName || 'conversion', metadata);
  }
};

/**
 * Track
 *
 * https://support.google.com/adwords/answer/6331314?hl=en&ref_topic=3165803&co=ADWORDS.IsAWNCustomer%3Dtrue&oco=0
 * https://developers.google.com/adwords-remarketing-tag/
 * NOTE: If customers want to send conversions to multiple accounts, they should:
 * "Alternatively, you should consider using cross-account conversion tracking which allows you to have a manager account (MCC) own
 * the conversion actions and share them with one or more of its sub-accounts. In doing so, you only need to specify a single conversion
 * identifier in the event snippet. Learn more about cross- account conversion tracking."
 *
 * But assuming pushback, we will allow overriding the default AdWords account ID per `.track()` if needed via UI settings
 * NOTE: Conversion tracking and remarketing functionalities are now combined into a single tag so no need for feature flag for remarketing
 *
 * @api public
 */

GoogleAdWordsNew.prototype.track = function(track) {
  var self = this;
  // A mapped event can either be a 'Page Load' or a 'Click' conversion in AdWords.
  // Depending on what you chose inside Adwords when creating the conversions, we should expect `properties.value` if that is what they want to send
  // But for purchase events, we should map revenue/total
  var eventName = track.event();
  var mappedConversions = matchConversion(
    this.options.clickConversions,
    track.event()
  );

  each(function(mappedConversion) {
    var properties = track.properties({ orderId: 'transaction_id' });
    var metadata = extend(properties, {
      send_to:
        (mappedConversion.override || self.options.accountId) +
        '/' +
        mappedConversion.id
    });
    // metadata shouldn't contain PII — warning by Google
    return window.gtag('event', eventName, metadata);
  }, mappedConversions);
};

/**
 * Order Completed
 *
 * https://support.google.com/adwords/answer/6331314?hl=en&ref_topic=3165803&co=ADWORDS.IsAWNCustomer%3Dtrue&oco=0
 * @api public
 */

GoogleAdWordsNew.prototype.orderCompleted = function(track) {
  var self = this;
  // A mapped event can either be a 'Page Load' or a 'Click' conversion in AdWords.
  // Depending on what you chose inside Adwords when creating the conversions, we should expect `properties.value` if that is what they want to send
  // But for purchase events, we should map revenue/total
  var eventName = track.event();
  var mappedConversions = matchConversion(
    this.options.clickConversions,
    track.event()
  );

  each(function(mappedConversion) {
    var properties = track.properties({
      orderId: 'transaction_id',
      order_id: 'transaction_id',
      revenue: 'value'
    });
    var metadata = extend(properties, {
      send_to:
        (mappedConversion.override || self.options.accountId) +
        '/' +
        mappedConversion.id
    });
    // metadata shouldn't contain PII — warning by Google
    return window.gtag('event', eventName, metadata);
  }, mappedConversions);
};

/**
 * Match Mapped AdWords conversions to your `.page()` or `.track()` calls
 *
 * @param {Array} mappedConversions
 * @param {String} segmentEvent
 */

function matchConversion(mappedConversions, segmentEvent) {
  var ret = [];
  each(function(setting) {
    var conversion = setting.value || setting;

    // to prevent common casing mistakes in our UI
    if (
      typeof segmentEvent === 'string' &&
      segmentEvent.toLowerCase() === conversion.event.toLowerCase()
    ) {
      var con = { id: conversion.id };
      if (conversion.accountId) con.override = conversion.accountId;

      ret.push(con);
    }
  }, mappedConversions);

  return ret;
}
