'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var when = require('do-when');

/**
 * Expose `Stripe` integration.
 */

var StripeRadar = (module.exports = integration('Stripe Radar')
  .option('apiKey', '')
  .tag('<script src="https://js.stripe.com/v2/">'));

/**
 * Initialize.
 *
 * @api public
 */

StripeRadar.prototype.initialize = function() {
  var self = this;
  // Prevent double loading
  if (window.Stripe && window.Stripe.setPublishableKey) {
    window.Stripe.setPublishableKey(this.options.apiKey);
    this.ready();
  } else {
    this.load(function() {
      // https://stripe.com/docs/stripe.js?#setting-publishable-key
      when(self.loaded, function() {
        window.Stripe.setPublishableKey(self.options.apiKey);
        self.ready();
      });
    });
  }
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

StripeRadar.prototype.loaded = function() {
  return window.Stripe && window.Stripe.setPublishableKey;
};
