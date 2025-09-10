'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `hellobar.com` integration.
 */

var Hellobar = (module.exports = integration('Hello Bar')
  .assumesPageview()
  .option('apiKey', '')
  .tag('<script src="//my.hellobar.com/{{ apiKey }}.js">'));

/**
 * Initialize.
 *
 * https://my.hellobar.com/a18c23dec1b87e9401465165eca61459d405684d.js
 *
 * @api public
 */

Hellobar.prototype.initialize = function() {
  this.load(this.ready);
};

Hellobar.prototype.loaded = function() {
  return !!window.hellobarSiteSettings;
};

/**
 * Track.
 *
 * https://hellobarassist.freshdesk.com/support/solutions/articles/44002393650-triggering-popups-and-bars-on-a-user-event
 *
 * @api public
 * @param {Track} track
 */

 Hellobar.prototype.track = function(track) {
  var event = track.event();
  var properties = track.properties();
  window.hellobar.trigger.event(event, properties);
};
