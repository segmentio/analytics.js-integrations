'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('__insp');

/**
 * Expose `Inspectlet` integration.
 */

var Inspectlet = module.exports = integration('Inspectlet')
  .assumesPageview()
  .global('__insp')
  .global('__insp_')
  .option('wid', '')
  .tag('<script src="//cdn.inspectlet.com/inspectlet.js">');

/**
 * Initialize.
 *
 * https://www.inspectlet.com/dashboard/embedcode/1492461759/initial
 *
 * @api public
 */

Inspectlet.prototype.initialize = function() {
  push('wid', this.options.wid);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Inspectlet.prototype.loaded = function() {
  return !!(window.__insp_ && window.__insp);
};

/**
 * Identify.
 *
 * http://www.inspectlet.com/docs#tagging
 *
 * @api public
 * @param {Identify} identify
 */

Inspectlet.prototype.identify = function(identify) {
  var traits = identify.traits({ id: 'userid' });
  var email = identify.email();
  if (email) push('identify', email);
  push('tagSession', traits);
};

/**
 * Track.
 *
 * http://www.inspectlet.com/docs/tags
 *
 * @api public
 * @param {Track} track
 */

Inspectlet.prototype.track = function(track) {
  push('tagSession', track.event(), track.properties());
};

/**
 * Page.
 *
 * http://www.inspectlet.com/docs/tags
 *
 * @api public
 * @param {Track} track
 */

Inspectlet.prototype.page = function() {
  push('virtualPage');
};
