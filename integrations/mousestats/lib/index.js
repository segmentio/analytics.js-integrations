'use strict';

/**
 * Module dependencies.
 */

var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var is = require('is');
var useHttps = require('use-https');

/**
 * Expose `MouseStats` integration.
 */

var MouseStats = module.exports = integration('MouseStats')
  .assumesPageview()
  .global('msaa')
  .global('MouseStatsVisitorPlaybacks')
  .option('accountNumber', '')
  .tag('http', '<script src="http://www2.mousestats.com/js/{{ path }}.js?{{ cacheBuster }}">')
  .tag('https', '<script src="https://ssl.mousestats.com/js/{{ path }}.js?{{ cacheBuster }}">');

/**
 * Initialize.
 *
 * http://www.mousestats.com/docs/pages/allpages
 *
 * @api public
 */

MouseStats.prototype.initialize = function() {
  var accountNumber = this.options.accountNumber;
  var path = accountNumber.slice(0, 1) + '/' + accountNumber.slice(1, 2) + '/' + accountNumber;
  var cacheBuster = Math.floor(new Date().getTime() / 60000);
  var tagName = useHttps() ? 'https' : 'http';
  this.load(tagName, { path: path, cacheBuster: cacheBuster }, this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

MouseStats.prototype.loaded = function() {
  return is.array(window.MouseStatsVisitorPlaybacks);
};

/**
 * Identify.
 *
 * http://www.mousestats.com/docs/wiki/7/how-to-add-custom-data-to-visitor-playbacks
 *
 * @api public
 * @param {Identify} identify
 */

MouseStats.prototype.identify = function(identify) {
  each(identify.traits(), function(key, value) {
    window.MouseStatsVisitorPlaybacks.customVariable(key, value);
  });
};
