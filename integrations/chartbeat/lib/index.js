'use strict';

/**
 * Module dependencies.
 */

var defaults = require('@ndhoule/defaults');
var integration = require('@segment/analytics.js-integration');
var onBody = require('on-body');

/**
 * Expose `Chartbeat` integration.
 */

var Chartbeat = module.exports = integration('Chartbeat')
  .global('_sf_async_config')
  .global('_sf_endpt')
  .global('pSUPERFLY')
  .option('domain', '')
  .option('uid', null)
  .option('video', false)
  .option('sendNameAndCategoryAsTitle', false)
  .option('subscriberEngagementKeys', [])

  .tag('<script src="//static.chartbeat.com/js/{{ script }}">');

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Chartbeat.prototype.loaded = function() {
  return !!window.pSUPERFLY;
};

Chartbeat.prototype.initialize = function() {
  this.pageCalledYet = false;
  this._ready = true; // temporarily switch ready to true so that a single page call can fire
};

/**
 * Page.
 *
 * http://chartbeat.com/docs/handling_virtual_page_changes/
 *
 * @api public
 * @param {Page} page
 */

Chartbeat.prototype.page = function(page) {
  this.updateConfig(page);

  // since chartbeat automatically calls a page when it loads, don't load chartbeat script until
  // first Segment page call comes in and configures global config vars using its props
  if (!this.pageCalledYet) {
    this._ready = false;  // switch ready to false so that no pages after the first one can fire until _initialize has loaded chartbeat script
    this.pageCalledYet = true;
    this._initialize();
  } else {
    var props = page.properties();
    window.pSUPERFLY.virtualPage(props.path);
  }
};

// update chartbeat global config vars
Chartbeat.prototype.updateConfig = function(page) {
  var category = page.category();
  var author = page.proxy('properties.author');
  var props = page.properties();

  // Chartbeat expects the document.title (props.title) to populate as title
  // This maintains legacy behavior for existing users,
  // defaults new users to the correct behavior,
  // and allows current users to opt-in to the correct behavior.
  // http://support.chartbeat.com/docs/#titles
  var title;
  if (this.options.sendNameAndCategoryAsTitle) {
    title = page.fullName() || props.title;
  } else {
    title = props.title;
  }

  // update general config
  window._sf_async_config = window._sf_async_config || {};

  if (category) window._sf_async_config.sections = category;
  if (author) window._sf_async_config.authors = author;
  if (title) window._sf_async_config.title = title;

  // update subscriber engagement
  var _cbq = window._cbq = window._cbq || [];

  for (var key in props) {
    if (!props.hasOwnProperty(key)) continue;
    if (this.options.subscriberEngagementKeys.indexOf(key) > -1) {
      _cbq.push([key, props[key]]);
    }
  }
};

// sets global vars and loads Chartbeat script
Chartbeat.prototype._initialize = function() {
  var self = this;
  var script = this.options.video ? 'chartbeat_video.js' : 'chartbeat.js';

  window._sf_async_config.useCanonical = true;
  defaults(window._sf_async_config, {
    domain: this.options.domain,
    uid: this.options.uid
  });

  onBody(function() {
    window._sf_endpt = new Date().getTime();
    // Note: Chartbeat depends on document.body existing so the script does
    // not load until that is confirmed. Otherwise it may trigger errors.
    self.load({ script: script }, self.ready);  // switch ready to true for real once the script has loaded
  });
};
