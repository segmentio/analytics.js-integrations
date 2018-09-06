'use strict';

/**
 * Module dependencies.
 */

var foldl = require('@ndhoule/foldl');
var is = require('is');
var integration = require('@segment/analytics.js-integration');
var omit = require('omit');

/**
 * Expose `Wootric` integration.
 */

var Wootric = module.exports = integration('Wootric')
  .assumesPageview()
  .option('accountToken', '')
  .global('wootricSettings')
  .global('wootric_survey_immediately')
  .global('wootric')
  .tag('library', '<script src="//cdn.wootric.com/wootric-sdk.js"></script>')
  .tag('pixel', '<img src="//d8myem934l1zi.cloudfront.net/pixel.gif?account_token={{ accountToken }}&email={{ email }}&created_at={{ createdAt }}&url={{ url }}&random={{ cacheBuster }}">');

/**
 * Initialize Wootric.
 *
 * @api public
 */

Wootric.prototype.initialize = function() {
  // We use this to keep track of the last page that Wootric has tracked to
  // ensure we don't accidentally send a duplicate page call
  this.lastPageTracked = null;
  window.wootricSettings = window.wootricSettings || {};
  window.wootricSettings.account_token = this.options.accountToken;

  var self = this;
  this.load('library', function() {
    self.ready();
  });
};

/**
 * Has the Wootric library been loaded yet?
 *
 * @api private
 * @return {boolean}
 */

Wootric.prototype.loaded = function() {
  // We are always ready since we are just setting a global variable in initialize
  return !!window.wootric;
};

/**
 * Identify a user.
 *
 * @api public
 * @param {Facade} identify
 */

Wootric.prototype.identify = function(identify) {
  var userId = identify.userId();
  var anonymousId = identify.anonymousId();
  var traits = identify.traits();
  var email = identify.email();
  var createdAt = identify.created();
  var language = traits.language;

  window.wootricSettings.segment_user_id = userId || anonymousId;
  if (language) window.wootricSettings.language = language;

  survey(email, createdAt, traits, null);
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Wootric.prototype.track = function(track) {
  var properties = track.properties();
  var email = track.email();
  var eventName = track.event();

  survey(email, null, properties, eventName);
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Wootric.prototype.page = function(page) {
  // Only track page if we haven't already tracked it
  if (this.lastPageTracked === window.location) {
    return;
  }

  // Set this page as the last page tracked
  this.lastPageTracked = window.location;

  var wootricSettings = window.wootricSettings;
  this.load('pixel', {
    accountToken: this.options.accountToken,
    email: encodeURIComponent(wootricSettings.email),
    createdAt: wootricSettings.created_at,
    url: encodeURIComponent(page.url()),
    cacheBuster: Math.random()
  });
};

/**
 * Convert trait key to Wootric format.
 *
 * @param {string} trait
 * @param {*} value
 */

function convertKey(key, value) {
  if (is.date(value) && !key.endsWith('_date')) return key + '_date';
  return key;
}

/**
 * Convert a date to unix timestamp.
 *
 * @api private
 * @param {Date} date
 * @return {number}
 */

function convertDate(date) {
  return Math.round(date.getTime() / 1000);
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
    var subjectString = this.toString();
    if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
      position = subjectString.length;
    }
    position -= searchString.length;
    var lastIndex = subjectString.lastIndexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
  };
}

/**
  * Survey end user
  *
  * @param {String} email
  * @param {Date} createdAt
  * @param {Object} properties
  * @param {String} eventName
  */

function survey(email, createdAt, properties, eventName) {
  if (createdAt && createdAt.getTime) window.wootricSettings.created_at = Math.round(createdAt.getTime() / 1000);
  window.wootricSettings.email = email;
  window.wootricSettings.event_name = eventName;

  // Convert keys to Wootric format
  var newProperties = foldl(function(results, value, key) {
    results[convertKey(key, value)] = is.date(value) ? convertDate(value) : value;
    return results;
  }, {}, properties);

  window.wootricSettings.properties = omit(['created', 'createdAt', 'email'], newProperties);

  window.wootric('run');
}
