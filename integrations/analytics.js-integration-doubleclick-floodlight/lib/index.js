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
  .tag('counter', '<iframe src="https://{{ src }}.fls.doubleclick.net/activityi;src={{ src }};type={{ type }};cat={{ cat }};dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord={{ ord }}{{ customVariables }}?">')
  .tag('sales', '<iframe src="https://{{ src }}.fls.doubleclick.net/activityi;src={{ src }};type={{ type }};cat={{ cat }};qty={{ qty }};cost={{ cost }};dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord={{ ord }}{{ customVariables }}?">')
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

    var tagParams = {
      src: settings.source,
      type: tag.type,
      cat: tag.cat,
      customVariables: customVariables
    };

    // there are two types of tags: counter and sales
    // counter basically are used to increment conversions
    // sales tags are used to collect revenue/cost data
    // ord for counter tags are cachebuster but for sales tag it is whatever you specified in your settings
    // sales tags takes some additional semantic ecommerce params
    if (tag.isSalesTag) {
      tagParams._type = 'sales';
      // you need to enable order ID reporting for sales tag inside dbl click UI if you want this to work properly
      var quantity = 0;
      if (track.products().length) {
        each(function(product) {
          quantity += product.quantity || 0;
        }, track.products());
      } else if (properties.quantity) {
        quantity = properties.quantity;
      }
      if (quantity) tagParams.qty = quantity;
      // doubleclick wants revenue under this cost param, yes
      if (track.revenue()) tagParams.cost = track.revenue();
      tagParams.ord = track.proxy(tag.ordKey);
    } else {
      tagParams.ord = Math.random() * 10000000000000000000;
    }

    conversions.push(tagParams);

    return conversions;
  }, [], mappedEvents);

  // Fire each tag
  each(function(tagParams) {
    if (tagParams._type === 'sales') return self.load('sales', tagParams);
    return self.load('counter', tagParams);
  }, tags);
};

/**
 * Page
 * Fire Floodlight image tags per Segment event
 *
 * https://support.google.com/dcm/partner/answer/2823425?hl=en&ref_topic=4241548
 * https://support.google.com/dcm/partner/answer/2823363
 * @api public
 * @param {Page}
 */

Floodlight.prototype.page = function(page) {
  var name = page.fullName();

  if (name) this.track(page.track(name));
};
