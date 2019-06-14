'use strict';

/**
 * Module dependencies.
 */

var cookie = require('component-cookie');
var each = require('@ndhoule/each');
var integration = require('@segment/analytics.js-integration');
var load = require('@segment/load-script');
var querystring = require('component-querystring');
var useHttps = require('use-https');

/**
 * hasOwnProperty reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Expose `Pardot` integration.
 */

var Pardot = (module.exports = integration('Pardot')
  .assumesPageview()
  .global('pi')
  .global('piAId')
  .global('piCId')
  .global('piTracker')
  .option('projectId', '')
  .option('piAId', '')
  .option('piCId', '')
  .tag('http', '<script src="http://cdn.pardot.com/pd.js">')
  .tag('https', '<script src="https://pi.pardot.com/pd.js">'));

/**
 * Initialize.
 *
 * http://developer.pardot.com/
 *
 * @api public
 */

Pardot.prototype.initialize = function() {
  window.piAId = this.options.piAId;
  window.piCId = this.options.piCId;
  var name = useHttps() ? 'https' : 'http';
  this.load(name, this.ready);
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

Pardot.prototype.loaded = function() {
  return !!window.piTracker;
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Pardot.prototype.identify = function(identify) {
  var traits = identify.traits();
  var email = identify.email();
  if (email) traits.email = email;
  // follow EU rules
  if (doNotTrack()) return;
  // must have an email
  if (!traits.email) return;

  var variables = this.getRequestVariables();
  variables.pi_email = traits.email;
  load('//pi.pardot.com/analytics?' + querystring.stringify(variables));
};

/**
 * Get request variables.
 *
 * @api private
 * @return {Object}
 */

Pardot.prototype.getRequestVariables = function() {
  // Note; we specifically want to emit URL, referrer, title
  // so that the visitor is associated but not counted
  // as an extra page view
  var variables = {
    account_id: window.piAId,
    campaign_id: window.piCId,
    pi_opt_in: cookie('pi_opt_in' + (this.options.piAId - 1e3)),
    ver: 3,
    visitor_id: cookie('visitor_id' + (this.options.piAId - 1e3))
  };

  // get all the query parameters
  var queryParams = query();
  // here are the query parameters we are looking for, but only the ones that
  // won't cause an extra page view to pop up in Omniture
  var queryKeys = ['pi_email'];

  // add all the query params to our variables list
  each(function(key) {
    if (key in queryParams) variables[key] = queryParams[key];
  }, queryKeys);

  // now check global variables
  if (window.piIncludeInActivities !== undefined) {
    variables.pi_include_in_activies = window.piIncludeInActivities;
  }
  if (window.piProfileId !== undefined) {
    variables.pi_profile_id = window.piProfileId;
  }

  // override with pi.tracker variables, if they've been updated
  // we don't want to take app pi.tracker properties cause then
  // we'll grab the page view properties and count as an extra page view
  if (window.pi && window.pi.tracker) {
    for (var property in variables) {
      if (has.call(variables, property)) {
        var val = window.pi.tracker[property];
        // don't override the account_id if it's not set yet
        if (val) variables[property] = val;
      }
    }
  }

  return variables;
};

/**
 * Determine whether the we should identify the user, following EU rules.
 *
 * TODO: what is going on here haha
 *
 * @api private
 * @return {boolean}
 */

function doNotTrack() {
  var p = window.pi;
  if (!p) return false;
  if (!p.tracker) return false;
  // XXX: I don't think it's necessary to explicitly cast to a string here,
  // but I converted this from == to ===, so just to be safe... (why isn't it
  // just a boolean?)
  if (String(p.tracker.pi_opt_in) === 'false') return false;
  if (!p.tracker.title) return false;
  if (!p.tracker.notify_pi) return false;
  return true;
}

/**
 * Get the query params from the URL.
 *
 * @api private
 * @return {Object}
 */

function query() {
  return querystring.parse(location.search.slice(1));
}
