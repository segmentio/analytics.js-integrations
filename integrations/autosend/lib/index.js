'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Autosend` integration.
 */

var Autosend = module.exports = integration('Autosend')
  .global('_autosend')
  .option('appKey', '')
  .tag('<script id="asnd-tracker" src="https://d2zjxodm1cz8d6.cloudfront.net/js/v1/autosend.js" data-auth-key="{{ appKey }}">');

/**
 * Initialize.
 *
 * http://autosend.io/faq/install-autosend-using-javascript/
 *
 * @api public
 */

Autosend.prototype.initialize = function() {
  window._autosend = window._autosend || [];
  /* eslint-disable */
  (function(){var a,b,c;a=function(f){return function(){window._autosend.push([f].concat(Array.prototype.slice.call(arguments,0))); }; }; b=["identify", "track", "cb"];for (c=0;c<b.length;c++){window._autosend[b[c]]=a(b[c]); } })();
  /* eslint-enable */
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Autosend.prototype.loaded = function() {
  return !!window._autosend;
};

/**
 * Identify.
 *
 * http://autosend.io/faq/install-autosend-using-javascript/
 *
 * @api public
 * @param {Identify} identify
 */

Autosend.prototype.identify = function(identify) {
  var id = identify.userId();
  if (!id) return;

  var traits = identify.traits();
  traits.id = id;
  window._autosend.identify(traits);
};

/**
 * Track.
 *
 * http://autosend.io/faq/install-autosend-using-javascript/
 *
 * @api public
 * @param {Track} track
 */

Autosend.prototype.track = function(track) {
  window._autosend.track(track.event());
};
