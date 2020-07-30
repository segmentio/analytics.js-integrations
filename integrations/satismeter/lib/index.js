'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var when = require('do-when');

/**
 * Expose `SatisMeter` integration.
 */

var SatisMeter = (module.exports = integration('SatisMeter')
  .global('satismeter')
  .option('token', '')
  .option('apiKey', '')
  .tag('<script src="https://app.satismeter.com/satismeter.js">'));

/**
 * Initialize.
 *
 * @api public
 */

SatisMeter.prototype.initialize = function() {
  var self = this;
  var options = this.options;
  this.load(function() {
    when(
      function() {
        return self.loaded();
      },
      function() {
        window.satismeter('load', {
          writeKey: options.apiKey || options.token,
          source: 'analytics.js'
        });
        self.ready();
      }
    );
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

SatisMeter.prototype.loaded = function() {
  return !!window.satismeter;
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

SatisMeter.prototype.identify = function(identify) {
  window.satismeter('identify', {
    userId: identify.userId(),
    anonymousId: identify.anonymousId(),
    traits: this.analytics.user().traits()
  });
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

SatisMeter.prototype.page = function(page) {
  window.satismeter('page', {
    userId: this.analytics.user().id(),
    anonymousId: this.analytics.user().anonymousId(),
    name: page.name(),
    category: page.category(),
    properties: page.properties()
  });
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

SatisMeter.prototype.track = function(track) {
  window.satismeter('track', {
    userId: this.analytics.user().id(),
    anonymousId: this.analytics.user().anonymousId(),
    event: track.event(),
    properties: track.properties()
  });
};

/**
 * group.
 *
 * @api public
 * @param {group} group
 */

SatisMeter.prototype.group = function(group) {
  window.satismeter('group', {
    userId: this.analytics.user().id(),
    anonymousId: this.analytics.user().anonymousId(),
    groupId: group.groupId(),
    traits: group.properties()
  });
};
