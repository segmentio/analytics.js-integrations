'use strict';

/**
 * Module dependencies.
 */

var Page = require('segmentio-facade').Page;
var convert = require('@segment/convert-dates');
var extend = require('@ndhoule/extend');
var integration = require('@segment/analytics.js-integration');
var iso = require('@segment/to-iso-string');

/**
 * Expose `Totango` integration.
 */

var Totango = (module.exports = integration('Totango')
  .assumesPageview()
  .global('totango')
  .global('totango_options')
  .global('__totango3')
  .option('disableHeartbeat', false)
  .option('serviceId', null)
  .option('trackNamedPages', true)
  .option('trackCategorizedPages', true)
  .tag('<script src="//tracker.totango.com/totango4.0.3.js">'));

/**
 * Initialize.
 *
 * http://help.totango.com/installing-totango/quick-start-installing-totango-on-your-web-app-using-javascript/
 *
 * @param {Object} page
 */

Totango.prototype.initialize = function(page) {
  page = page || new Page({});

  /* eslint-disable */
  window.totango = {
    go:function(){return -1;},
    setAccountAttributes:function(){},
    identify:function(){},
    track:function(t,o,n,a){window.totango_tmp_stack.push({activity:t,module:o,org:n,user:a}); return -1;}};
  /* eslint-enable */

  /* Int Totango JS */
  var defaultRegion = 'us'
  var selected_region = this.options.region ?  this.options.region : defaultRegion; 
  window.totango_options = {
    allow_empty_accounts: false,
    service_id: this.options.serviceId,
    disable_heartbeat: this.options.disableHeartbeat,
    region: selected_region,
    module: page.category()
  };

  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */

Totango.prototype.loaded = function() {
  return !!window.__totango3;
};

/**
 * Page.
 *
 * @param {Page} page
 */

Totango.prototype.page = function(page) {
  var user = this.analytics.user();
  var group = this.analytics.group();
  var opts = this.options;
  var category = page.category();
  var name = page.fullName();
  if (category && opts.trackCategorizedPages) this.track(page.track(category));
  if (name && opts.trackNamedPages) this.track(page.track(name));
  this._category = category;
  if (!user.id() || !group.id())
    return this.debug('must identify and group first');
  if (!category) return this.debug('category required');
  this.go({ module: category });
};

/**
 * Identify.
 *
 * @param {Identify} identify
 */

Totango.prototype.identify = function(identify) {
  if (!identify.userId()) return this.debug('id required');
  var traits = identify.traits({ created: 'Create Date' });
  this.go({
    user: convert(traits, iso),
    username: traits.id
  });
};

/**
 * Group.
 *
 * @param {Group} group
 */

Totango.prototype.group = function(group) {
  if (!group.groupId()) return this.debug('id required');
  var traits = group.traits({ created: 'Create Date' });
  var options = { account: convert(traits, iso) };
  var totangoOptions = group.integrations().Totango;

  if (totangoOptions) {
    if (totangoOptions.parent) {
      options.account.parent = convert(totangoOptions.parent, iso);
    }

    if (totangoOptions.product) {
      options.product = convert(totangoOptions.product, iso);
    }

    if (totangoOptions.hasOwnProperty('enableHierarchy')) {
      options.enableHierarchy = totangoOptions.enableHierarchy;
    }
  }

  this.go(options);
};

/**
 * Track.
 *
 * @param {Track} track
 */

Totango.prototype.track = function(track) {
  var props = track.properties();
  window.totango.track(track.event(), props.category || this._category);
};

/**
 * Helper for `totango.go` to always mix in the right options.
 *
 * @param {Object} options
 */

Totango.prototype.go = function(options) {
  var defs = {
    allow_empty_accounts: false,
    service_id: this.options.serviceId,
    disable_heartbeat: this.options.disableHeartbeat
  };

  options = options || {};
  options = extend({}, defs, options);

  window.totango.go(options);
};
