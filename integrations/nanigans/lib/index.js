'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var Track = require('segmentio-facade').Track;
var integration = require('@segment/analytics.js-integration');
var normalize = require('to-no-case');
var qs = require('component-querystring');
var sha256 = require('js-sha256');

/**
 * Expose `Nanigans`.
 */

var Nanigans = module.exports = integration('Nanigans')
  .option('appId', '')
  .option('events', {})
  .tag('page', '<img src="//api.nanigans.com/event.php?app_id={{ appId }}&type=visit&name=landing">')
  .tag('track', '<img src="//api.nanigans.com/event.php?app_id={{ appId }}&type={{ type }}&name={{ name }}&user_id={{ userId }}&ut1={{ ut1 }}">')
  .tag('track_no_user_id', '<img src="//api.nanigans.com/event.php?app_id={{ appId }}&type={{ type }}&name={{ name }}&ut1={{ ut1 }}">')
  .tag('product', '<img src="//api.nanigans.com/event.php?app_id={{ appId }}&type=purchase&name={{ name }}&user_id={{ userId }}&ut1={{ ut1 }}&sku={{ sku }}">')
  .tag('add_to_cart', '<img src="//api.nanigans.com/event.php?app_id={{ appId }}&type=user&name={{ name }}&user_id={{ userId }}&ut1={{ ut1 }}&{{ products }}">')
  .tag('add_to_cart_no_user_id', '<img src="//api.nanigans.com/event.php?app_id={{ appId }}&type=user&name={{ name }}&ut1={{ ut1 }}&{{ products }}">')
  .tag('purchase', '<img src="//api.nanigans.com/event.php?app_id={{ appId }}&type={{ type }}&name={{ name }}&user_id={{ userId }}&ut1={{ ut1 }}&unique={{ orderId }}&{{ products }}">')
  .tag('purchase_no_user_id', '<img src="//api.nanigans.com/event.php?app_id={{ appId }}&type={{ type }}&name={{ name }}&ut1={{ ut1 }}&unique={{ orderId }}&{{ products }}">');

/**
 * Initialize.
 *
 * https://s3.amazonaws.com/segmentio/docs/integrations/nanigans/docs.html
 *
 * @api public
 */

Nanigans.prototype.initialize = function() {
  // TODO: assert nan_pid URL parameter is present.
  this.ready();
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

Nanigans.prototype.loaded = function() {
  // We load Nanigans pixels on conversions, so we don't need to preload anything
  return true;
};

/**
 * Page.
 *
 * @api public
 * @param {Page} page
 */

Nanigans.prototype.page = function() {
  this.load('page');
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

Nanigans.prototype.track = function(track) {
  var user = this.analytics.user();

  var events = get(this.options.events, track.event());
  if (!events.length) return;
  var products = track.products();
  var data = {};

  data.app_id = this.options.appId;
  data.user_id = user.id();
  data.unique = track.orderId();
  data.sku = Array(products.length);
  data.qty = Array(products.length);
  data.value = Array(products.length);

  // see readme comment
  if (email(user) != null) {
    data.ut1 = sha256(email(user));
  }

  for (var i = 0; i < products.length; i++) {
    var item = new Track({ properties: products[i] });
    data.qty[i] = item.quantity();
    data.sku[i] = item.sku();
    data.value[i] = item.price();
  }

  // some events may create multiple pixels.
  for (var j = 0; j < events.length; j++) {
    var event = events[j];
    var params = {
      appId: data.app_id,
      name: renderByProxy(event.name, track),
      type: event.type,
      ut1: data.ut1,
      products: {}
    };
    if (data.user_id) params.userId = data.user_id;

    switch (event.type) {
    case 'purchase':
      params.orderId = data.unique;
      params.products.qty = data.qty;
      params.products.value = data.value;
      params.products.sku = data.sku;
      params.products = qs.stringify(params.products);
      params.userId ? this.load('purchase', params) : this.load('purchase_no_user_id', params);
      break;
    case 'user':
      switch (event.name) {
      case 'product':
        params.sku = data.sku;
        break;
      case 'add_to_cart':
        params.products.qty = data.qty;
        params.products.value = data.value;
        params.products.sku = data.sku;
        params.products = qs.stringify(params.products);
        params.userId ? this.load('add_to_cart', params) : this.load('add_to_cart_no_user_id', params);
        break;
      default:
        params.userId ? this.load('track', params) : this.load('track_no_user_id', params);
        break;
      }
      break;
    default:
      params.userId ? this.load('track', params) : this.load('track_no_user_id', params);
      break;
    }
  }
};

/**
 * Get an event of `name`.
 *
 * Given something like this:
 *
 * [
 *   { key: 'a', value: { type: 'user', name: 'register' } }
 *   { key: 'a', value: { type: 'user', name: 'invite' } }
 *   { key: 'b', value: { type: 'purchase', name: 'main' } }
 * ]
 *
 * If you do `get(events, 'a')`, it wll give you:
 *
 * [
 *   { type: 'user', name: 'register' },
 *   { type: 'user', name: 'invite' }
 * ]
 *
 * @param {Array} events
 * @param {String} name
 * @return {Object}
 */

function get(events, name) {
  var a = normalize(name);
  var ret = [];

  for (var i = 0; i < events.length; ++i) {
    var b = normalize(events[i].key || events[i].event);
    if (b === a) ret.push(events[i].value || events[i]);
  }

  return ret;
}

/**
 * Get email from user.
 *
 * @param {Object} user
 * @return {String}
 */

function email(user) {
  var identify = new Identify({ userId: user.id(), traits: user.traits() });
  return identify.email();
}

/**
 * Render Nanigans event name from template.
 *
 * @param {Object} user
 * @return {String}
 */

function renderByProxy(template, facade) {
  return template.replace(/\{\{\ *(\w+?[\.\w+]*?)\ *\}\}/g, function(_, $1) {
    return facade.proxy($1) || '';
  });
}