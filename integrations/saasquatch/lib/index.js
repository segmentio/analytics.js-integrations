'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var objCase = require('obj-case');

/**
 * Expose `SaaSquatch` integration.
 */

var SaaSquatch = module.exports = integration('SaaSquatch')
  .option('tenantAlias', '')
  .option('referralImage', '')
  .global('_sqh')
  .tag('<script src="//d2rcp9ak152ke1.cloudfront.net/assets/javascripts/squatch.min.js">');

/**
 * Initialize.
 *
 * @api public
 */

SaaSquatch.prototype.initialize = function() {
  window._sqh = window._sqh || [];
  window._sqh.push(['init', {
    tenant_alias: this.options.tenantAlias
  }]);
  this.load(this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

SaaSquatch.prototype.loaded = function() {
  return window._sqh && window._sqh.push !== Array.prototype.push;
};

/**
 * Identify.
 *
 * @api public
 * @param {Facade} identify
 */

SaaSquatch.prototype.identify = function(identify) {
  var sqh = window._sqh;
  var opts = identify.options(this.name);
  var id = identify.userId();
  var email = identify.email();

  if (!(id || email)) return;
  if (this.called) return;


  var init = identify.traits();

  init.email = email;
  init.user_id = id;
  objCase.del(init, 'id');

  init.tenant_alias = this.options.tenantAlias;

  init.first_name = identify.firstName();
  init.last_name = identify.lastName();
  init.user_image = identify.avatar();

  // Pull SaaSquatch specific properties from options, but fallback to traits
  var properties = [
    'account_id',
    'payment_provider_id',
    'account_status',
    'referral_code',
    'user_referral_code',
    'checksum',
    'mode',
    'locale'
  ];
  for (var i = 0; i < properties.length; i++) {
    var prop = properties[i];
    var value = objCase.find(opts, prop) || objCase.find(init, prop);
    objCase.del(init, prop);
    if (value) {
      init[prop] = value;
    }
  }

  if (init.payment_provider_id === 'null') {
    init.payment_provider_id = null;
  }

  var image = objCase.find(opts, 'referralImage') || objCase.find(init, 'referralImage') || this.options.referralImage;
  if (image) {
    objCase.del(init, 'referralImage');
    init.fb_share_image = image;
  }

  sqh.push(['init', init]);
  this.called = true;
  this.load();
};

/**
 * Group.
 *
 * @api public
 * @param {Group} group
 */

SaaSquatch.prototype.group = function(group) {
  var sqh = window._sqh;
  var id = group.groupId();
  var image = group.proxy('traits.referralImage') || this.options.referralImage;
  var opts = group.options(this.name);

  // tenant_alias is required.
  if (this.called) return;

  var init = {
    tenant_alias: this.options.tenantAlias,
    account_id: id
  };

  if (opts.checksum) init.checksum = opts.checksum;
  if (image) init.fb_share_image = image;

  sqh.push(['init', init]);
  this.called = true;
  this.load();
};
