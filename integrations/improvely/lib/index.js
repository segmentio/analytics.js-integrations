'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Improvely` integration.
 */

var Improvely = module.exports = integration('Improvely')
  .assumesPageview()
  .global('_improvely')
  .global('improvely')
  .option('domain', '')
  .option('projectId', null)
  .tag('<script src="//{{ domain }}.iljmp.com/improvely.js">');

/**
 * Initialize.
 *
 * http://www.improvely.com/docs/landing-page-code
 *
 * @api public
 */

Improvely.prototype.initialize = function() {
  // Shim out the Improvely library/globals.
  window._improvely = [];
  /* eslint-disable */
  window.improvely = { init: function(e, t){ window._improvely.push(["init", e, t]); }, goal: function(e){ window._improvely.push(["goal", e]); }, label: function(e){ window._improvely.push(["label", e]); }};
  /* eslint-enable */

  var domain = this.options.domain;
  var id = this.options.projectId;
  window.improvely.init(domain, id);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Improvely.prototype.loaded = function() {
  return !!(window.improvely && window.improvely.identify);
};

/**
 * Identify.
 *
 * http://www.improvely.com/docs/labeling-visitors
 *
 * @api public
 * @param {Identify} identify
 */

Improvely.prototype.identify = function(identify) {
  var id = identify.userId();
  if (id) window.improvely.label(id);
};

/**
 * Track.
 *
 * http://www.improvely.com/docs/conversion-code
 *
 * @api public
 * @param {Track} track
 */

Improvely.prototype.track = function(track) {
  var props = track.properties({ revenue: 'amount' });
  props.type = track.event();
  window.improvely.goal(props);
};
