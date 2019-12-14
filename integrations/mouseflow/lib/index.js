'use strict';

/**
 * Module dependencies.
 */

var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var push = require('global-queue')('_mfq');

/**
 * Expose `Mouseflow`.
 */

var Mouseflow = (module.exports = integration('Mouseflow')
  .assumesPageview()
  .global('_mfq')
  .global('mouseflow')
  .global('mouseflowHtmlDelay')
  .option('apiKey', '')
  .option('mouseflowHtmlDelay', 0)
  .tag('<script src="//cdn.mouseflow.com/projects/{{ apiKey }}.js">'));

/**
 * Initalize.
 *
 * @api public
 */

Mouseflow.prototype.initialize = function() {
  window.mouseflowHtmlDelay = this.options.mouseflowHtmlDelay;
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Mouseflow.prototype.loaded = function() {
  return !!window.mouseflow;
};

/**
 * Page.
 *
 * http://mouseflow.zendesk.com/entries/22528817-Single-page-websites
 *
 * @api public
 * @param {Page} page
 */

Mouseflow.prototype.page = function(page) {
  push('newPageView', page.path());
};

/**
 * Identify.
 *
 * http://mouseflow.zendesk.com/entries/24643603-Custom-Variables-Tagging
 *
 * @api public
 * @param {Identify} identify
 */

Mouseflow.prototype.identify = function(identify) {
  set(identify.traits());
};

/**
 * Track.
 *
 * http://mouseflow.zendesk.com/entries/24643603-Custom-Variables-Tagging
 *
 * @api public
 * @param {Track} track
 */

Mouseflow.prototype.track = function(track) {
  var props = track.properties();
  props.event = track.event();
  set(props);
};

/**
 * Push each key and value in the given `obj` onto the queue.
 *
 * @api private
 * @param {Object} obj
 */

function set(obj) {
  each(obj, function(key, value) {
    push('setVariable', key, value);
  });
}
