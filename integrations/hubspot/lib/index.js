'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var convert = require('@segment/convert-dates');
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_hsq');
var each = require('@ndhoule/each');

/**
 * Expose `HubSpot` integration.
 */

var HubSpot = module.exports = integration('HubSpot')
  .assumesPageview()
  .global('_hsq')
  .option('portalId', null)
  .tag('<script id="hs-analytics" src="https://js.hs-analytics.net/analytics/{{ cacheBuster }}/{{ portalId }}.js">');

/**
 * Initialize.
 *
 * @api public
 */

HubSpot.prototype.initialize = function() {
  window._hsq = [];
  var cacheBuster = Math.ceil(new Date() / 300000) * 300000;
  this.load({ cacheBuster: cacheBuster }, this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

HubSpot.prototype.loaded = function() {
  return !!(window._hsq && window._hsq.push !== Array.prototype.push);
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

HubSpot.prototype.page = function() {
  push('trackPageView');
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

HubSpot.prototype.identify = function(identify) {
  // use newer version of Identify to have access to `companyName`
  var newIdentify = new Identify({
    traits: identify.traits(),
    userId: identify.userId()
  });

  if (!newIdentify.email()) {
    return;
  }

  var traits = newIdentify.traits({ firstName: 'firstname', lastName: 'lastname' });
  traits = convertDates(traits);
  traits = formatTraits(traits);

  if (newIdentify.companyName() !== undefined) {
    traits.company = newIdentify.companyName();
  }

  push('identify', traits);
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

HubSpot.prototype.track = function(track) {
  // Hubspot expects properties.id to be the name of the .track() event
  // Ref: http://developers.hubspot.com/docs/methods/enterprise_events/javascript_api
  var props = convertDates(track.properties({ id: '_id', revenue: 'value' }));
  props.id = track.event();

  push('trackEvent', track.event(), props);
};

/**
 * Convert all the dates in the HubSpot properties to millisecond times
 *
 * @api private
 * @param {Object} properties
 */

function convertDates(properties) {
  return convert(properties, function(date) { return date.getTime(); });
}

/**
 * lowercase & snakecase any trait with uppercase letters or spaces
 * Hubspot cannot accept uppercases or spaces
 *
 * @api private
 * @param {Object} traits
 * @return {Object} ret
 */

function formatTraits(traits) {
  var ret = {};
  each(function(value, key) {
    // Using split/join due to IE 11 failing to properly support regex in str.replace()
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/@@replace
    var k = key.toLowerCase()
      .split(' ').join('_') // spaces
      .split('.').join('_') // Periods
      .split('\n').join('_') // new lines
      .split('\v').join('_') // Vertical tabs
      .split('\t').join('_') // Regular tabs
      .split('\f').join('_') // form feeds
      .split('\r').join('_'); // Carriage returns
    ret[k] = value;
  }, traits);

  return ret;
}
