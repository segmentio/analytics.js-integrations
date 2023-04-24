'use strict';

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Smartlook` integration
 */

var Smartlook = module.exports = integration('Smartlook').option('token', '');

/**
 * Initialize Smartlook
 */
Smartlook.prototype.initialize = function() {
  if (!this.options.token) {
    console.warn('Smartlook Integration is missing API token.');
    return false;
  }

  if (window.smartlook) {
    console.warn('Smartlook Integration is already initialized.');
    return false;
  }
  window.smartlook = function() {
    window.smartlook.api.push(arguments);
  };
  window.smartlook.api = [];
  window.smartlook('init', this.options.token);

  var head = window.document.getElementsByTagName('head')[0];
  var script = window.document.createElement('script');
  script.async = true;
  script.type = 'text/javascript';
  script.charset = 'utf-8';
  script.src = 'https://rec.smartlook.com/recorder.js';
  head.appendChild(script);

  this.ready();
  return true;
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */
Smartlook.prototype.loaded = function() {
  return !!window.smartlook;
};

/**
 * Identify.
 *
 * @param {Identify} identify
 */
Smartlook.prototype.identify = function(identify) {
  var userId = identify.userId();
  if (!userId) {
    userId = identify.anonymousId();
  }

  var traits =  identify.traits();
  delete traits.id;

  window.smartlook('identify', userId, traits);
};

/**
 * Track.
 *
 * @param {Track} track
 */
Smartlook.prototype.track = function(track) {
  window.smartlook('track', track.event(), track.properties());
};
