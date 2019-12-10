'use strict';

/**
 * Module dependencies.
 */

var convertDates = require('@segment/convert-dates');
var integration = require('@segment/analytics.js-integration');
var md5 = require('spark-md5').hash;

/**
 * Expose `Boomtrain` integration.
 */

var Boomtrain = module.exports = integration('Boomtrain')
  .global('_bt')
  .option('apiKey', '')
  .tag('<script src="https://cdn.boomtrain.com/analyticstrain/{{ apiKey }}/analyticstrain.min.js"></script>');

/**
 * Initialize.
 *
 *
 *
 * @api public
 */

Boomtrain.prototype.initialize = function() {
  window._bt = window._bt || [];
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Boomtrain.prototype.loaded = function() {
  return !!(window._bt && window._bt.push !== Array.prototype.push);
};

/**
 * Identify.
 *
 *
 *
 * @api public
 * @param {Identify} identify
 */

Boomtrain.prototype.identify = function(identify) {
  var userId = identify.userId();
  if (!userId) return this.debug('user id required');
  var traits = identify.traits({ createdAt: 'created_at' });
  traits = convertDates(traits, convertDate);
  traits.email = identify.email();
  window._bt.person.set(traits);
};

/**
 * Page.
 *
 *
 *
 * @api public
 * @param {Page} page
 */

Boomtrain.prototype.page = function(page) {
  var properties = page.properties();
  if (!properties.model) properties.model = getModel() || undefined;
  if (!properties.id) properties.id = md5(page.url());
  window._bt.track('viewed', properties);
};

/**
 * Track.
 *
 *
 *
 * @api public
 * @param {Track} track
 */

Boomtrain.prototype.track = function(track) {
  var properties = track.properties();
  window._bt.track(track.event(), properties);
};

/**
 * Convert a date to the format Boomtrain supports.
 *
 * @api private
 * @param {Date} date
 * @return {number}
 */

function convertDate(date) {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Get model of page, stored under meta-tag with property "og:type"
 *
 * @api private
 * @param
 * @return {string}
 */

function getModel() {
  var elements = window.document.getElementsByTagName('meta');
  var data = {};
  var pattern = 'og:';
  var key = 'property';
  for (var i = elements.length - 1; i >= 0; i--) {
    var property = elements[i].getAttribute && elements[i].getAttribute(key);
    if (property && property.match(pattern)) {
      data[property.replace(pattern, '')] = elements[i].getAttribute('content');
    }
  }
  return data.type;
}
