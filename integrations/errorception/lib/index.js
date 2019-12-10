'use strict';

/**
 * Module dependencies.
 */

var extend = require('@ndhoule/extend');
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_errs');

/**
 * Expose `Errorception` integration.
 */

var Errorception = module.exports = integration('Errorception')
  .assumesPageview()
  .global('_errs')
  .option('projectId', '')
  .option('meta', true)
  .tag('<script src="//beacon.errorception.com/{{ projectId }}.js">');

/**
 * Initialize.
 *
 * https://github.com/amplitude/Errorception-Javascript
 *
 * @api public
 */

Errorception.prototype.initialize = function() {
  window._errs = window._errs || [this.options.projectId];

  if (typeof window.onerror === 'function' && window.onerror !== push) {
    var oldOnerror = window.onerror;
    window.onerror = function() {
      oldOnerror.apply(window, arguments);
      push.apply(window, arguments);
    };
  } else {
    window.onerror = push;
  }

  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Errorception.prototype.loaded = function() {
  return !!(window._errs && window._errs.push !== Array.prototype.push);
};

/**
 * Identify.
 *
 * http://blog.errorception.com/2012/11/capture-custom-data-with-your-errors.html
 *
 * @api public
 * @param {Object} identify
 */

Errorception.prototype.identify = function(identify) {
  if (!this.options.meta) return;
  var traits = identify.traits();
  window._errs = window._errs || [];
  window._errs.meta = window._errs.meta || {};
  extend(window._errs.meta, traits);
};
