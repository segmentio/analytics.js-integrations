'use strict';

/**
 * Module dependencies.
 */

var each = require('@ndhoule/each');
var foldl = require('@ndhoule/foldl');
var integration = require('@segment/analytics.js-integration');
var map = require('@ndhoule/map');
var snake = require('to-snake-case');
var useHttps = require('use-https');

/**
 * Expose `AdRoll` integration.
 */

var AdRoll = module.exports = integration('AdRoll')
  .assumesPageview()
  .global('__adroll')
  .global('__adroll_loaded')
  .global('adroll_adv_id')
  .global('adroll_custom_data')
  .global('adroll_email')
  .global('adroll_pix_id')
  .option('advId', '')
  .option('pixId', '')
  .option('_version', 2)
  .tag('http', '<script src="http://a.adroll.com/j/roundtrip.js">')
  .tag('https', '<script src="https://s.adroll.com/j/roundtrip.js">')
  .mapping('events');

/**
 * Initialize.
 *
 * http://support.adroll.com/getting-started-in-4-easy-steps/#step-one
 * http://support.adroll.com/enhanced-conversion-tracking/
 *
 * @api public
 */

AdRoll.prototype.initialize = function() {
  window.adroll_adv_id = this.options.advId;
  window.adroll_pix_id = this.options.pixId;
  window.__adroll_loaded = true;
  var name = useHttps() ? 'https' : 'http';
  this.load(name, this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

AdRoll.prototype.loaded = function() {
  return !!window.__adroll;
};

/**
 * Page.
 *
 * http://support.adroll.com/segmenting-clicks/
 *
 * @api public
 * @param {Page} page
 */

AdRoll.prototype.page = function(page) {
  this.track(page.track(page.fullName()));
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

AdRoll.prototype.identify = function(identify) {
  if (identify.email()) {
    window.adroll_email = identify.email();
    window.__adroll.record_adroll_email('segment');
  }
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

AdRoll.prototype.track = function(track) {
  var events = this.events(track.event());
  var userId = this.analytics.user().id();
  var data = formulateData(track, { revenue: 'adroll_conversion_value' });
  // As of April 2015, Adroll no longer accepts segments by name, instead
  // segmenting exclusively by segment ID, which will be present in events map
  // TODO: Deprecate and remove this behavior
  if (this.options._version === 1) {
    // If this is an unmapped event, fall back on a snakeized event name
    if (!events.length) events = [track.event()];
    // legacy (v1) behavior is to snakeize all mapped `events` values
    events = map(snake, events);
  }

  if (userId) data.user_id = userId;

  sendConversion(events, data);
};

/**
 * Product Viewed/Added
 *
 * @api public
 * @param {Track} track
 */

AdRoll.prototype.productViewed = AdRoll.prototype.productAdded = function(track) {
  var events = this.events(track.event());
  var userId = this.analytics.user().id();
  var data = formulateData(track, {
    id: 'product_id',
    productId: 'product_id',
    price: 'adroll_conversion_value'
  });

  if (this.options._version === 1) {
    // If this is an unmapped event, fall back on a snakeized event name
    if (!events.length) events = [track.event()];
    // legacy (v1) behavior is to snakeize all mapped `events` values
    events = map(snake, events);
  }

  if (userId) data.user_id = userId;

  sendConversion(events, data);
};

/**
 * Order Completed
 *
 * @api public
 * @param {Track} track
 */

AdRoll.prototype.orderCompleted = function(track) {
  var events = this.events(track.event());
  var userId = this.analytics.user().id();
  var data = formulateData(track, {
    orderId: 'order_id',
    revenue: 'adroll_conversion_value'
  });

  if (track.properties().currency) {
    data.adroll_currency = track.properties().currency;
    delete data.currency;
  }

  if (this.options._version === 1) {
    // If this is an unmapped event, fall back on a snakeized event name
    if (!events.length) events = [track.event()];
    // legacy (v1) behavior is to snakeize all mapped `events` values
    events = map(snake, events);
  }

  if (userId) data.user_id = userId;

  sendConversion(events, data);
};

/**
 * Send conversion events
 *
 * @params {Object, Object} events, data
 * @api private
 */

function sendConversion(events, data) {
  each(function(segmentId) {
    data.adroll_segments = segmentId;
    window.__adroll.record_user(data);
  }, events);
}

/**
 * Format data payload
 *
 * @params {Object, Object} track, alias
 * @api private
 */

function formulateData(track, alias) {
  var aliases = alias || {};
  var ret = foldl(function(props, val, key) {
    props[snake(key)] = val;
    return props;
  }, track.properties(aliases));

  return ret;
}
