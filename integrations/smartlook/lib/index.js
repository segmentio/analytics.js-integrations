'use strict';

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Smartlook` integration
 */

var Smartlook = (module.exports = integration('Smartlook')
  .option('token', '')
  .tag('<script src="https://web-sdk.smartlook.com/recorder.js">'));

/**
 * Initialize Smartlook
 */
Smartlook.prototype.initialize = function() {
  if (!this.options.token) {
    console.warn('Smartlook Integration is missing API token.');
    return false;
  }

  var token = this.options.token;
  var region = 'eu';

  // Project token may contain region, so check for it and handle it
  if (token.indexOf(';') > -1) {
    const splitTokenAndRegion = token.split(';');
    token = splitTokenAndRegion[0];
    region = splitTokenAndRegion[1];
  }

  if (region !== 'eu' && region !== 'us') {
    region = 'eu';
  }

  if (window.smartlook) {
    console.warn('Smartlook Integration is already initialized.');
    return false;
  }
  window.smartlook = function() {
    window.smartlook.api.push(arguments);
  };
  window.smartlook.api = [];
  window.smartlook('init', token, { region: region });

  this.load(this.ready);

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

  var traits = identify.traits();
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
