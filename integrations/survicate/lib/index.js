'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var when = require('do-when');
var del = require('obj-case').del;
var is = require('is');
var snake = require('change-case').snakeCase;
var each = require('@ndhoule/each');


/**
 * Expose `Survicate` integration.
 */

var Survicate = module.exports = integration('Survicate')
  .global('_sva')
  .option('workspaceKey', '')
  .tag('<script src="https://survey.survicate.com/workspaces/{{ workspaceKey }}/web_surveys.js">');

/**
 * Initialize.
 *
 * @api public
 */

Survicate.prototype.initialize = function() {
  var self = this;
  this.load(function() {
    when(function() { return self.loaded(); }, self.ready);
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Survicate.prototype.loaded = function() {
  return !!(window._svc && window._svc.initialized);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Survicate.prototype.identify = function(identify) {
  var traits = identify.traits({ userId: 'user_id' });
  del(traits, 'id');

  each(function(value, key) {
    if (is.object(value)) {
      // flatten object
      del(traits, key);
      each(function(innerValue, innerKey) {
        traits[snake(key) + '_' + snake(innerKey)] = innerValue;
      }, value);
    } else if (is.array(value)) {
      // drop arrays
      del(traits, key);
    } else {
      // convert camelCase to snake_case
      del(traits, key);
      traits[snake(key)] = value;
    }
  }, traits);

  window._sva.setVisitorTraits(traits);
};

/**
 * Group.
 *
 * @api public
 * @param {Group} group
 */

Survicate.prototype.group = function(group) {
  var traits = group.traits({
    groupId: 'group_id'
  });
  del(traits, 'id');

  each(function(value, key) {
    if (is.object(value)) {
      // flatten object
      del(traits, key);
      each(function(innerValue, innerKey) {
        traits['group_' + snake(key) + '_' + snake(innerKey)] = innerValue;
      }, value);
    } else if (is.array(value)) {
      // drop arrays
      del(traits, key);
    } else if (key !== 'group_id') {
      // convert camelCase to snake_case
      del(traits, key);
      traits['group_' + snake(key)] = value;
    }
  }, traits);

  window._sva.setVisitorTraits(traits);
};
