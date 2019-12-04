'use strict';

/**
 * Module dependencies.
 */

var Group = require('segmentio-facade').Group;
var Identify = require('segmentio-facade').Identify;
var extend = require('@ndhoule/extend');
var integration = require('@segment/analytics.js-integration');
var obj = require('obj-case');

/**
 * Expose `Pendo` integration.
 */

var Pendo = module.exports = integration('Pendo')
  .global('pendo')
  .option('apiKey', '')
  .tag('<script src="https://cdn.pendo.io/agent/static/{{ apiKey }}/pendo.js">');

/**
 * Either use this as a TagLoader and all the relevant Pendo information will
 * already be loaded in window.pendo_options. Or, if not, they're using this in
 * a Segment way and will call identify and group when that information is
 * available. In which case, we want to use the API.
 *
 * @api public
 */

Pendo.prototype.initialize = function() {
  window.pendo = window.pendo || {};
  window.pendo_options = window.pendo_options || { apiKey: this.options.apiKey, usePendoAgentAPI: true };

  this.load(this.ready, { apiKey: this.options.apiKey });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Pendo.prototype.loaded = function() {
  return !!window.pendo;
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Pendo.prototype.identify = function(identify) {
  var group = this.analytics.group();
  var identifyGroup = new Group({
    groupId: group.id(),
    traits: group.traits()
  });

  _identify(identify, identifyGroup);
};

/**
 * Group.
 *
 * @api public
 * @param {Group} group
 */

Pendo.prototype.group = function(group) {
  var user = this.analytics.user();
  var identify = new Identify({
    userId: user.id(),
    traits: user.traits()
  });
  _identify(identify, group);
};

function isUserAnonymous(identify) {
  return !identify.userId();
}
function pendoifyAnonymousId(anonymousId) {
  return '_PENDO_T_'+anonymousId;
}

/**
 * Internal Identify. Identify and Group trigger the same general call.
 *
 * @param {Identify} identify
 * @param {Group} group
 */

function _identify(identify, group) {
  // Collapse everything into an options block.
  var id = isUserAnonymous(identify)
    ? pendoifyAnonymousId(identify.anonymousId())
    : identify.userId();

  var vObj = extend({ id: id }, identify.traits());
  var options = { visitor: vObj };

  var groupTraits = group.traits();

  var parentAccount = obj.find(groupTraits, 'parentAccount');
  if (parentAccount) {
    obj['delete'](groupTraits, 'parentAccount');
    options.parentAccount = parentAccount;
  }

  var account = extend({ id: group.groupId() }, groupTraits);
  options.account = account;

  // Pick up everything else
  extend(window.pendo_options, options);

  // Identify is smart. It will only identify if things actually changed.
  // Given we are passing an options object, it will also call updateOptions()
  // updateOptions() only fires a meta event if the metadata changes.
  window.pendo.identify(window.pendo_options);
}
