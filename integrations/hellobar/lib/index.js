'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `hellobar.com` integration.
 */

var Hellobar = module.exports = integration('Hello Bar')
  .assumesPageview()
  .option('apiKey', '')
  .tag('<script src="//my.hellobar.com/{{ apiKey }}.js">');

/**
 * Initialize.
 *
 * https://s3.amazonaws.com/scripts.hellobar.com/bb900665a3090a79ee1db98c3af21ea174bbc09f.js
 *
 * @api public
 */

Hellobar.prototype.initialize = function() {
  this.load(this.ready);
};

Hellobar.prototype.loaded = function() {
  return typeof window.hellobar === 'function';
};
