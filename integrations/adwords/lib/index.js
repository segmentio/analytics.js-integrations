'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var when = require('do-when');

/**
 * Expose `AdWords`.
 */

var AdWords = module.exports = integration('AdWords')
  .option('conversionId', '')
  .option('pageRemarketing', false)
  .option('eventMappings', [])
  .tag('<script src="//www.googleadservices.com/pagead/conversion_async.js">');

/**
 * Initialize.
 *
 * @api public
 */

AdWords.prototype.initialize = function() {
  var loaded = this.loaded;
  var ready = this.ready;
  this.load(function() {
    when(loaded, ready);
  });
};

/**
 * Loaded.
 *
 * @api private
 * @return {boolean}
 */

AdWords.prototype.loaded = function() {
  return !!(document.body && window.google_trackConversion);
};

/**
 * Page.
 *
 * https://support.google.com/adwords/answer/3111920#standard_parameters
 * https://support.google.com/adwords/answer/3103357
 * https://developers.google.com/adwords-remarketing-tag/asynchronous/
 * https://developers.google.com/adwords-remarketing-tag/parameters
 *
 * @api public
 * @param {Page} page
 */

AdWords.prototype.page = function(page) {
  // Remarketing option can support both Adwords' "static" or "dynamic" remarketing tags
  // Difference is static you don't need to send props under `google_custom_params`
  var remarketing = this.options.pageRemarketing;
  var id = this.options.conversionId;
  var props = page.properties();

  // Conversion tag
  window.google_trackConversion({
    google_conversion_id: id,
    google_custom_params: {},
    google_remarketing_only: false // this ensures that this is a conversion tag
  });

  // Remarketing tag (must be sent in _addition_ to any conversion tags)
  // https://developers.google.com/adwords-remarketing-tag/
  if (remarketing) {
    window.google_trackConversion({
      google_conversion_id: id,
      google_custom_params: props,
      google_remarketing_only: true // this ensures that this is a remarketing tag
    });
  }
};

/**
 * Track.
 *
 * @api public
 * @param {Track}
 */

AdWords.prototype.track = function(track) {
  var self = this;
  var props = track.properties();
  var eventMappings = this.options.eventMappings;
  var revenue = track.revenue() || 0;

  eventMappings.forEach(function(mapping) {
    if (mapping.value) {
      if (mapping.value.eventName.toLowerCase() !== track.event().toLowerCase()) return;
      var id = mapping.value.conversionId ||  self.options.conversionId;  // customer can either specify one global conversion id or one per  mapping
  
      // Fire conversion tag
      if (mapping.value.label !== '') {
        delete props.revenue;
      
        window.google_trackConversion({
          google_conversion_id: id,
          google_custom_params: props,
          google_conversion_language: 'en',
          google_conversion_format: '3',
          google_conversion_color: 'ffffff',
          google_conversion_label: mapping.value.label,
          google_conversion_value: revenue,
          google_remarketing_only: false // ensure this is a conversion tag
        });
      }
  
      // Fire remarketing tag
      if (mapping.value.remarketing) {
        window.google_trackConversion({
          google_conversion_id: id,
          google_custom_params: props, // do not send PII here!
          google_remarketing_only: true // ensure this is a remarketing tag
        });
      }
    } else {
      if (mapping.eventName.toLowerCase() !== track.event().toLowerCase()) return;
      id = mapping.conversionId ||  self.options.conversionId;  // customer can either specify one global conversion id or one per  mapping
  
      // Fire conversion tag
      if (mapping.label !== '') {
        delete props.revenue;
      
        window.google_trackConversion({
          google_conversion_id: id,
          google_custom_params: props,
          google_conversion_language: 'en',
          google_conversion_format: '3',
          google_conversion_color: 'ffffff',
          google_conversion_label: mapping.label,
          google_conversion_value: revenue,
          google_remarketing_only: false // ensure this is a conversion tag
        });
      }
  
      // Fire remarketing tag
      if (mapping.remarketing) {
        window.google_trackConversion({
          google_conversion_id: id,
          google_custom_params: props, // do not send PII here!
          google_remarketing_only: true // ensure this is a remarketing tag
        });
      }
    }
  });
};
