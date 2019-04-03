'use strict';

/**
 * Module Dependencies
 */

var integration = require('@segment/analytics.js-integration');
var each = require('@ndhoule/each');
var foldl = require('@ndhoule/foldl');
var qs = require('component-querystring');
var find = require('obj-case').find;
var toNoCase = require('to-no-case');
var cookie = require('component-cookie');

/**
 * Expose `DoubleClick Floodlight` integration.
 */

var Floodlight = module.exports = integration('DoubleClick Floodlight')
  .option('source', '')
  .option('getDoubleClickId', false)
  .option('googleNetworkId', '')
  .option('segmentWriteKey', '')
  .tag('counter', '<iframe src="https://{{ src }}.fls.doubleclick.net/activityi;src={{ src }};type={{ type }};cat={{ cat }};dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord={{ ord }}{{ customVariables }}?">')
  .tag('sales', '<iframe src="https://{{ src }}.fls.doubleclick.net/activityi;src={{ src }};type={{ type }};cat={{ cat }};qty={{ qty }};cost={{ cost }};dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord={{ ord }}{{ customVariables }}?">')
  .tag('doubleclick id', '<img src="//cm.g.doubleclick.net/pixel?google_cm&google_nid={{ googleNetworkId }}&segment_write_key={{ segmentWriteKey }}&user_id={{ userId }}&anonymous_id={{ anonymousId }}"/>');

/**
 * Initialize.
 *
 * https://support.google.com/dcm/partner/answer/4293719?hl=en&ref_topic=4241548
 * @api public
 */


Floodlight.prototype.initialize = function() {
  var cookieOptions = {
    // 2 weeks.
    maxage: 1209600,
    secure: false,
    path: '/'
  };
  // In the initialize method:
  // Check if we should load the DoubleClick ID pixel (and only proceed if we haven't already done so).
  if (this.options.getDoubleClickId && this.options.googleNetworkId) {
    if (!cookie('doubleclick_id_ts')) {
      // Load the doubleclick pixel.
      this.load('doubleclick id', {
        googleNetworkId: this.options.googleNetworkId,
        segmentWriteKey: this.options.segmentWriteKey,
        // TODO: handle userId being nulls/undefined.
        userId: this.analytics.user().id(),
        anonymousId: this.analytics.user().anonymousId()
      });
      // Set a cookie so we only need to load the pixel periodically.
      cookie('doubleclick_id_ts', (new Date()).getTime(), cookieOptions);
    }
  }
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
  var mappedEvents = [];
  if (!this.options.events || !this.options.events.length) return;

  // retrieve event mappings that match the current event
  for (var i=0; i<this.options.events.length; i++) {
    var item = this.options.events[i];
    if (item.value) {
      if (toNoCase(item.key) === toNoCase(track.event())) mappedEvents.push(item.value);
    } else if (toNoCase(item.event) === toNoCase(track.event())) {
      mappedEvents.push(item);
    }
  }
  var settings = this.options;

  // Must have events mapped and DoubleClick Advertiser ID
  if (!mappedEvents.length || !settings.source) return;
  var properties = track.properties();
  var self = this;

  // Prepare tag params for each mapped Floodlight Activity
  var tags = foldl(function(conversions, tag) {
    var type = tag.type || settings.groupTag;
    var event = tag.event;
    var cat = tag.cat || settings.activityTag;

    if (!event || !cat || !type) return conversions;

    // Find matching properties if any
    var matchedVariables = {};
    each(function(variable) {
      var floodlightProp = variable.value;
      var segmentProp = variable.key.match(/{{(.*)}}/) || variable.key;
      var segmentPropValue;

      if (Array.isArray(segmentProp)) {
        segmentProp = segmentProp.pop();
        segmentPropValue = find(track.json(), segmentProp);
      } else {
        segmentPropValue = properties[segmentProp];
      }

      if (segmentPropValue) {
        matchedVariables[floodlightProp] = segmentPropValue;
      }
    }, tag.customVariable);

    var customVariables = qs.stringify(matchedVariables).replace(/&/g, ';');
    if (tag.customVariable.length) customVariables = ';' + customVariables;

    var tagParams = {
      src: settings.source,
      type: type,
      cat: cat,
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
  },
  [],
  mappedEvents
  );

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
