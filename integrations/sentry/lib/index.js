'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var is = require('is');
var foldl = require('@ndhoule/foldl');
/**
 * Expose `Sentry` integration.
 */

var Sentry = (module.exports = integration('Sentry')
  .global('Sentry')
  .option('config', '')
  .option('environment', null)
  .option('serverName', null)
  .option('release', null)
  .option('ignoreErrors', []) // still exists, but not documented on Sentry's website
  .option('ignoreUrls', [])
  .option('whitelistUrls', [])
  .option('includePaths', []) // deprecated
  .option('maxMessageLength', null) // deprecated
  .option('logger', null)
  .option('customVersionProperty', null)
  .option('debug', false)
  .tag(
    '<script src="https://browser.sentry-cdn.com/5.11.0/bundle.min.js" integrity="sha384-jbFinqIbKkHNg+QL+yxB4VrBC0EAPTuaLGeRT0T+NfEV89YC6u1bKxHLwoo+/xxY" crossorigin="anonymous"></script>'
  ));

/**
 * Initialize.
 * https://docs.sentry.io/error-reporting/quickstart/?platform=browser
 *
 * @api public
 */

Sentry.prototype.initialize = function() {
  var customRelease = this.options.customVersionProperty
    ? window[this.options.customVersionProperty]
    : null;

  var options = {
    dsn: this.options.config,
    environment: this.options.environment,
    release: customRelease || this.options.release,
    serverName: this.options.serverName,
    whitelistUrls: this.options.whitelistUrls,
    blacklistUrls: this.options.ignoreUrls,
    // ignoreErrors still exists, but is not documented on Sentry's website
    // https://github.com/getsentry/sentry-javascript/blob/master/packages/core/src/integrations/inboundfilters.ts#L12
    ignoreErrors: this.options.ignoreErrors,
    debug: this.options.debug
  };

  var logger = this.options.logger;
  var self = this;
  this.load(function() {
    window.Sentry.onLoad(function() {
      window.Sentry.init(reject(options));

      if (logger) {
        window.Sentry.setTag('logger', logger);
      }
    });

    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Sentry.prototype.loaded = function() {
  return is.object(window.Sentry);
};

/**
 * Identify.
 *
 * @api public
 * @param {Identify} identify
 */

Sentry.prototype.identify = function(identify) {
  window.Sentry.setUser(identify.traits());
};

/**
 * Clean out null values
 */

function reject(obj) {
  return foldl(
    function(result, val, key) {
      var payload = result;

      // strip any null or empty string values
      if (val !== null && val !== '' && !is.array(val)) {
        payload[key] = val;
      }
      // strip any empty arrays
      if (is.array(val)) {
        var ret = [];
        // strip if there's only an empty string or null in the array since the settings UI lets you save additional rows even though some may be empty strings
        for (var x = 0; x < val.length; x++) {
          if (val[x] !== null && val[x] !== '') ret.push(val[x]);
        }
        if (!is.empty(ret)) {
          payload[key] = ret;
        }
      }
      return payload;
    },
    {},
    obj
  );
}
