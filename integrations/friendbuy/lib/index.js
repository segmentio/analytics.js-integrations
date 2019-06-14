'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var find = require('obj-case').find;
var reject = require('reject');
var each = require('@ndhoule/each');
var Facade = require('segmentio-facade').Track;
var normalize = require('to-no-case');
var is = require('is');

/**
 * Expose `FriendBuy` integration.
 */

var FriendBuy = (module.exports = integration('FriendBuy')
  .global('friendbuy')
  .option('siteId', '')
  .option('widgets', [])
  .option('siteWideWidgets', [])
  .tag('<script src="//djnf6e5yyirys.cloudfront.net/js/friendbuy.min.js">'));

/**
 * Initialize.
 *
 * http://developers.friendbuy.com.s3-website-us-east-1.amazonaws.com/#site-identification
 * http://developers.friendbuy.com.s3-website-us-east-1.amazonaws.com/#widget-management
 * @api public
 */

FriendBuy.prototype.initialize = function() {
  var settings = this.options;
  window.friendbuy = window.friendbuy || [];

  // used to identify your account in our platform so we can properly attribute referral data.
  // You can find your site key in the in Friendbuy web application at Settings > Integration Code.
  window.friendbuy.push(['site', settings.siteId]);

  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

FriendBuy.prototype.loaded = function() {
  return window.friendbuy;
};

/**
 * Page
 *
 * "Widget Management"
 * http://developers.friendbuy.com.s3-website-us-east-1.amazonaws.com/#widget-management
 *
 * You can map specific `.page()` names to a widget and its respective custom advanced configuration settings
 * since average FB user has multiple unique widgets deployed on specific pages
 *
 * @api public
 */

FriendBuy.prototype.page = function(page) {
  var widgetSettings = get(this.options.widgets, page.name());

  // Place the widget with `widgetId` into its default location unless widgetSelector defined
  if (widgetSettings.id) {
    var commands = ['widget', widgetSettings.id];

    if (widgetSettings.selector) commands.push(widgetSettings.selector);

    var config = {
      // The display configuration options control how and when a widget is invoked.
      configuration: {
        auto_delay: widgetSettings.autoDelay
          ? parseInt(widgetSettings.autoDelay, 10)
          : null // A value of 0 indicates manual widget invocation which is the default. Waits this many milliseconds after loading to display. Must be null otherwise so that it allows FB UI entered value to override
      }
    };

    // The parameters option is a collection of key-value pairs. These values are added to referral links for the associated widget to facilitate tracking and reporting on referral traffic.
    // The idea is to dynamically set values for defined keys by looking up properties by the provided fields
    var parameters = {};
    each(function(pair) {
      var segmentKey = pair.key;
      var fbKey = pair.value;
      var value = page.proxy('properties.' + segmentKey);
      if (value) return (parameters[fbKey] = value);
    }, widgetSettings.parameters);

    if (!is.empty(parameters)) config.parameters = parameters;

    commands.push(config);

    // Load the widget!
    window.friendbuy.push(commands);
  }

  // Load site wide widgets additional if widget ID is provided
  if (this.options.siteWideWidgets.length) {
    each(function(setting) {
      var widget = setting.value || setting || {};
      var commands = ['widget', widget.id];
      if (widget.selector) commands.push(widget.selector);
      var configs = {
        // The display configuration options control how and when a widget is invoked.
        configuration: {
          auto_delay: widget.autoDelay ? parseInt(widget.autoDelay, 10) : null // A value of 0 indicates manual widget invocation which is the default. Waits this many milliseconds after loading to display. Must be null otherwise so that it allows FB UI entered value to override
        }
      };
      var parameters = {};
      each(function(pair) {
        var segmentKey = pair.key;
        var fbKey = pair.value;
        var value = page.proxy('properties.' + segmentKey);
        if (value) return (parameters[fbKey] = value);
      }, widget.parameters);

      if (!is.empty(parameters)) configs.parameters = parameters;

      commands.push(configs);
      window.friendbuy.push(commands);
    }, this.options.siteWideWidgets);
  }
};

/**
 * Identify
 *
 * "Customer Tracking"
 * http://developers.friendbuy.com.s3-website-us-east-1.amazonaws.com/#customer-tracking
 *
 * @api public
 */

FriendBuy.prototype.identify = function(identify) {
  if (!identify.userId()) return; // required

  var options = identify.options(this.name);
  var customerDetail = reject({
    id: identify.userId(),
    email: identify.email(),
    first_name: identify.firstName(),
    last_name: identify.lastName(),
    stripe_customer_id: find(options, 'stripe_customer_id'),
    chargebee_customer_id: find(options, 'chargebee_customer_id')
  });

  window.friendbuy.push(['track', 'customer', customerDetail]);
};

/**
 * Order Completed
 *
 * "Order Tracking"
 * http://developers.friendbuy.com.s3-website-us-east-1.amazonaws.com/#order-tracking
 *
 * @api public
 */

FriendBuy.prototype.orderCompleted = function(track) {
  if (!track.orderId()) return; // required

  var options = track.options(this.name);
  var orderDetail = reject({
    id: track.orderId(),
    email: track.email(),
    amount: track.revenue(),
    coupon_code: track.proxy('properties.coupon'),
    new_customer: find(options, 'new_customer')
  });

  window.friendbuy.push(['track', 'order', orderDetail]);

  var orderList = [];
  each(function(item) {
    var i = new Facade({ properties: item });

    if (i.sku()) {
      orderList.push(
        reject({
          sku: i.sku(),
          price: i.price(),
          quantity: i.quantity()
        })
      );
    }
  }, track.products());

  window.friendbuy.push(['track', 'products', orderList]);
};

/**
 * Find any mapped settings to page `name`.
 *
 * Given something like this:
 *
 * [
 *   { value: { type: 'user', name: 'register' } }
 *   { value: { type: 'user', name: 'invite' } }
 *   { value: { type: 'purchase', name: 'main' } }
 * ]
 *
 * If you do `get(events, 'b')`, it wll give you:
 *
 * { type: 'purchase', name: 'main' }
 *
 * @param {Array} events
 * @param {String} name
 * @return {Object}
 */

function get(events, name) {
  var ret = {};
  var pageName = normalize(name || '');

  each(function(widget) {
    if (widget.value && pageName === normalize(widget.value.name)) {
      ret = widget.value;
    } else if (pageName === normalize(widget.name)) {
      ret = widget;
    }
  }, events);

  return ret;
}
