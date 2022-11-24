'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var isObject = require('isobject');

/**
 * Expose `Atatus` integration.
 */

var Atatus = (module.exports = integration('Atatus')
  .global('atatus')
  .option('apiKey', '')
  .option('version', '')

  .option('disableRUM', false)
  .option('disableSession', false)
  .option('disableSPA', false)
  .option('disableAjaxMonitoring', false)
  .option('disableErrorTracking', false)
  .option('disableTransaction', false)

  .option('whitelistUrls', [])
  .option('ignoreUrls', [])
  .option('ignoreErrors', [])

  .option('hashRoutes', false)
  .option('reportUnhandledRejections', false)
  .option('enableOffline', false)

  .tag('<script src="//dmc1acwvwny3.cloudfront.net/{{ lib }}.js">'));

/**
 * Initialize.
 *
 * https://docs.atatus.com/docs/browser-monitoring/customize-agent.html
 *
 * @api public
 */

Atatus.prototype.initialize = function() {
  var lib = this.options.disableSPA ? 'atatus' : 'atatus-spa';
  var self = this;

  this.load({ lib: lib }, function() {
    var configOptions = {
      version: self.options.version,

      disableRUM: self.options.disableRUM,
      disableSession: self.options.disableSession,
      disableSPA: self.options.disableSPA,
      disableAjaxMonitoring: self.options.disableAjaxMonitoring,
      disableErrorTracking: self.options.disableErrorTracking,
      disableTransaction: self.options.disableTransaction,

      whitelistUrls: self.options.whitelistUrls,
      ignoreUrls: self.options.ignoreUrls,
      ignoreErrors: self.options.ignoreErrors,

      hashRoutes: self.options.hashRoutes,
      reportUnhandledRejections: self.options.reportUnhandledRejections
    };

    // Configure Atatus and install default handler to capture uncaught
    // exceptions
    window.atatus.config(self.options.apiKey, configOptions).install();

    window.atatus.enableOffline(self.options.enableOffline);

    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Atatus.prototype.loaded = function() {
  return isObject(window.atatus);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Atatus.prototype.identify = function(identify) {
  var uid = identify.userId();
  var traits = identify.traits() || {};
  var email = traits.email;
  var name = traits.name;

  if (uid) {
    window.atatus.setUser(uid, email, name);
  }

  window.atatus.setCustomData(traits);
};
