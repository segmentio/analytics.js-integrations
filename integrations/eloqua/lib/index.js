'use strict';

/**
 * Module dependencies.
 */

var push = require('global-queue')('_elqQ');
var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Eloqua`
 */

var Eloqua = (module.exports = integration('Eloqua')
  .assumesPageview()
  .global('_elq')
  .global('_elqQ')
  .option('siteId', '')
  .tag('<script src="//img.en25.com/i/elqCfg.min.js">'));

/**
 * Initialize.
 *
 * @api public
 */

Eloqua.prototype.initialize = function() {
  push('elqSetSiteId', this.options.siteId);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

Eloqua.prototype.loaded = function() {
  return !!window._elqQ;
};

/**
 * Page
 *
 * @api public
 * @param {Page}
 */

Eloqua.prototype.page = function(page) {
  var props = page.properties();
  push('elqTrackPageView', props.url, props.referrer);
};
