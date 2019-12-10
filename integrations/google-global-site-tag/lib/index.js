'use strict';

var adwords = require('./adwords');
var analytics = require('./analytics');
var doubleclick = require('./doubleclick');

var integration = require('@segment/analytics.js-integration');

var Gtag = module.exports = integration('Google Global Site Tag')
  .tag('<script src="https://www.googletagmanager.com/gtag/js?id={{ accountId }}">');

adwords.setDefaults(Gtag);

Gtag.prototype.initialize = function() {
  if (this.options.adwords) return adwords.initialize.call(this);
  if (this.options.analytics) return analytics.initialize.call(this);
  if (this.options.doubleclick) return analytics.initialize.call(this);
};

Gtag.prototype.loaded = function() {
  if (this.options.adwords) return adwords.loaded.call(this);
};

Gtag.prototype.page = function(payload) {
  if (this.options.adwords) return adwords.page.call(this, payload);
};

Gtag.prototype.track = function(payload) {
  if (this.options.adwords) return adwords.track.call(this, payload);
};

Gtag.prototype.orderCompleted = function(payload) {
  if (this.options.adwords) return adwords.orderCompleted.call(this, payload);
};
