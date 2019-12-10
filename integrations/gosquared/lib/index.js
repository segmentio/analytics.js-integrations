'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var Track = require('segmentio-facade').Track;
var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var omit = require('omit');
var pick = require('pick');

/**
 * Expose `GoSquared` integration.
 */

var GoSquared = module.exports = integration('GoSquared')
  .assumesPageview()
  .global('_gs')
  .option('anonymizeIP', false)
  .option('apiSecret', '')
  .option('cookieDomain', null)
  .option('trackHash', false)
  .option('trackLocal', false)
  .option('trackParams', true)
  .option('useCookies', true)
  .tag('<script src="//d1l6p2sc9645hc.cloudfront.net/tracker.js">');

/**
 * Initialize.
 *
 * https://www.gosquared.com/developer/tracker
 * Options: https://www.gosquared.com/developer/tracker/configuration
 *
 * @api public
 */

GoSquared.prototype.initialize = function() {
  var self = this;
  var options = this.options;
  var user = this.analytics.user();
  push(options.apiSecret);

  each(options, function(name, value) {
    if (name === 'apiSecret') return;
    if (value == null) return;
    push('set', name, value);
  });

  self.identify(new Identify({
    traits: user.traits(),
    userId: user.id()
  }));

  self.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

GoSquared.prototype.loaded = function() {
  // If the tracker version is set, the library has loaded
  return !!(window._gs && window._gs.v);
};

/**
 * Page.
 *
 * https://www.gosquared.com/docs/tracking/api/#pageviews
 *
 * @param {Page} page
 */

GoSquared.prototype.page = function(page) {
  var props = page.properties();
  var name = page.fullName();
  push('track', props.path, name || props.title);
};

/**
 * Identify.
 *
 * https://www.gosquared.com/docs/tracking/identify
 *
 * @param {Identify} identify
 */

GoSquared.prototype.identify = function(identify) {
  var traits = identify.traits({
    createdAt: 'created_at',
    firstName: 'first_name',
    lastName: 'last_name',
    title: 'company_position',
    industry: 'company_industry'
  });

  // https://www.gosquared.com/docs/tracking/api/#properties
  var specialKeys = [
    'id',
    'email',
    'name',
    'first_name',
    'last_name',
    'username',
    'description',
    'avatar',
    'phone',
    'created_at',
    'company_name',
    'company_size',
    'company_position',
    'company_industry'
  ];

  // Segment allows traits to all be in a flat object
  // GoSquared requires all custom properties to be in a `custom` object,

  // select all special keys
  var props = pick.apply(null, [traits].concat(specialKeys));
  props.custom = omit(specialKeys, traits);

  var id = identify.userId();

  if (id) {
    push('identify', id, props);
  } else {
    push('properties', props);
  }
};

/**
 * Track.
 *
 * https://www.gosquared.com/docs/tracking/events
 *
 * @param {Track} track
 */

GoSquared.prototype.track = function(track) {
  push('event', track.event(), track.properties());
};

/**
 * Checked out.
 *
 * https://www.gosquared.com/docs/tracking/ecommerce
 *
 * @api private
 * @param {Track} track
 */

GoSquared.prototype.orderCompleted = function(track) {
  var products = track.products();
  var items = [];

  each(products, function(product) {
    var track = new Track({ properties: product });
    items.push({
      category: track.category(),
      quantity: track.quantity(),
      price: track.price(),
      name: track.name()
    });
  });

  push('transaction', track.orderId(), {
    revenue: track.total(),
    track: true
  }, items);
};

/**
 * Push to `_gs.q`.
 *
 * @api private
 * @param {...*} args
 */

function push() {
  window._gs = window._gs || function() {
    window._gs.q.push(arguments);
  };
  window._gs.q = window._gs.q || [];
  window._gs.apply(null, arguments);
}
