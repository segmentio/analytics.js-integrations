'use strict';

/**
 * Module Dependencies
 */

var integration = require('@segment/analytics.js-integration');
var each = require('@ndhoule/each');
var foldl = require('@ndhoule/foldl');
var qs = require('component-querystring');

/**
 * Expose `DoubleClick Floodlight` integration.
 */

var Floodlight = module.exports = integration('DoubleClick Floodlight')
  .option('source', '')
  .tag('<iframe src="https://{{ src }}.fls.doubleclick.net/activityi;src={{ src }};type={{ type }};cat={{ cat }};dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord={{ ord }}{{ customVariables }}?">')
  .mapping('events');

/**
 * Initialize.
 *
 * https://support.google.com/dcm/partner/answer/4293719?hl=en&ref_topic=4241548
 * @api public
 */

Floodlight.prototype.initialize = function() {
  this.ready();
};

/**
 * Track
 * Fire Floodlight image tags per Segment event
 *
 * https://support.google.com/dcm/partner/answer/2823425?hl=en&ref_topic=4241548
 * https://support.google.com/dcm/partner/answer/2823363
 * @api public
 * @param {Track}
 */

Floodlight.prototype.track = function(track) {
  // Returns array of objects
  var mappedEvents = this.events(track.event());
  var settings = this.options;

  // Must have events mapped and DoubleClick Advertiser ID
  if (!mappedEvents.length || !settings.source) return;
  var properties = track.properties();
  var self = this;

  // Prepare tag params for each mapped Floodlight Activity
  var tags = foldl(function(conversions, tag) {
    // Required params. These should already be validated at the app level but just in case
    if (!tag.event || !tag.cat || !tag.type) return conversions;

    // Find matching properties if any
    var matchedVariables = {};
    each(function(variable) {
      var segmentProp = variable.key;
      var floodlightProp = variable.value;
      var segmentPropValue = properties[segmentProp];

      if (segmentPropValue) matchedVariables[floodlightProp] = segmentPropValue;
    }, tag.customVariable);

    var customVariables = qs.stringify(matchedVariables).replace(/&/g, ';');
    if (tag.customVariable.length) customVariables = ';' + customVariables;

    var cacheBuster = Math.random() * 10000000000000000000;
    var tagParams = {
      src: settings.source,
      type: tag.type,
      cat: tag.cat,
      ord: cacheBuster,
      customVariables: customVariables
    };

    conversions.push(tagParams);

    return conversions;
  }, [], mappedEvents);

  // Fire each tag
  each(function(tagParams) {
    return self.load(tagParams);
  }, tags);
};

Floodlight.prototype.page = function(page) {
  var name = page.fullName();

  if (name) this.track(page.track(name));
};