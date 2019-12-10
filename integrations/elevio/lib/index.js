'use strict';

var integration = require('@segment/analytics.js-integration');
var tick = require('next-tick');
var objCase = require('obj-case');
var each = require('@ndhoule/each');
var objectKeys = require('@ndhoule/keys');

/**
 * Expose `Elevio` integration.
 */

var Elevio = module.exports = integration('Elevio')
  .option('accountId', '')
  .global('_elev')
  .tag('<script src="//static.elev.io/js/v3.js">');

/**
 * Initialize elevio.
 */

Elevio.prototype.initialize = function() {
  var self = this;
  window._elev = window._elev || {};
  window._elev.account_id = this.options.accountId;
  window._elev.segment = true;
  this.load(function() {
    tick(self.ready);
  });
};

/**
 * Has the elevio library been loaded yet?
 *
 * @return {Boolean}
 */

Elevio.prototype.loaded = function() {
  return !!window._elev;
};

/**
 * Identify a user.
 *
 * @param {Facade} identify
 */

Elevio.prototype.identify = function(identify) {
  var name = identify.name();
  var email = identify.email();
  var plan = identify.proxy('traits.plan');
  var traits = identify.traits();

  var removeTraits = ['id', 'name', 'firstName', 'lastName', 'email'];

  each(function(traitItem) {
    if (traits.hasOwnProperty(traitItem)) {
      objCase.del(traits, traitItem);
    }
  }, removeTraits);

  var user = {};
  user.via = 'segment';
  if (email) user.email = email;
  if (name) user.name = name;
  if (plan) user.plan = [plan];
  if (plan) user.groups = [plan];
  if (objectKeys(traits).length > 0) user.traits = traits;
  window._elev.user = user;
  if (typeof window._elev.setUser === 'function') {
    window._elev.setUser(user);
  }
};
