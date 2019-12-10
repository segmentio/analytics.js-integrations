'use strict';

/**
 * Module dependencies.
 */

var alias = require('@segment/alias');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Nudgespot` integration.
 */

var Nudgespot = module.exports = integration('Nudgespot')
  .assumesPageview()
  .global('nudgespot')
  .option('clientApiKey', '')
  .tag('<script id="nudgespot" src="//cdn.nudgespot.com/nudgespot.js">');

/**
 * Initialize Nudgespot.
 *
 * @api public
 */

Nudgespot.prototype.initialize = function() {
  window.nudgespot = window.nudgespot || [];

  // XXX(ndhoule): This script has been modified to:
  //   1) Remove the Nudgespot snippet's script loading logic
  //   2) Fix a global variable leak
  /* eslint-disable */
  !function(e){e.init=function(p){function t(e,p){var t=p.split(".");2==t.length&&(e=e[t[0]],p=t[1]),e[p]=function(){e.push([p].concat(Array.prototype.slice.call(arguments,0)))}}e._version=.1,e._globals=[p],e.people=e.people||[],e.params=e.params||[];for(var o="track register unregister identify set_config people.delete people.create people.update people.create_property people.tag people.remove_Tag".split(" "),r=0;r<o.length;r++)t(e,o[r])}}(window.nudgespot);
  /* eslint-enable */

  window.nudgespot.init(this.options.clientApiKey);
  this.load(this.ready);
};

/**
 * Has the Nudgespot library been loaded yet?
 *
 * @api private
 * @return {boolean}
 */

Nudgespot.prototype.loaded = function() {
  return !!(window.nudgespot && window.nudgespot.push !== Array.prototype.push);
};

/**
 * Identify a user.
 *
 * @api public
 * @param {Identify} identify
 */

Nudgespot.prototype.identify = function(identify) {
  if (!identify.userId()) return this.debug('user id required');
  var traits = identify.traits({ createdAt: 'created' });
  traits = alias(traits, { created: 'created_at' });
  window.nudgespot.identify(identify.userId(), traits);
};

/**
 * Track an event.
 *
 * @api public
 * @param {Track} track
 */

Nudgespot.prototype.track = function(track) {
  window.nudgespot.track(track.event(), track.properties());
};
