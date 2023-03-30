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
  .option('includePaths', []) // maps to Sentry.Integrations.RewriteFrames plugin
  .option('maxMessageLength', null) // deprecated
  .option('logger', null)
  .option('customVersionProperty', null)
  .option('debug', false)
  .tag(
    'sentry',
    '<script src="https://browser.sentry-cdn.com/5.12.1/bundle.min.js" integrity="sha384-y+an4eARFKvjzOivf/Z7JtMJhaN6b+lLQ5oFbBbUwZNNVir39cYtkjW1r6Xjbxg3" crossorigin="anonymous"></script>'
  )
  // Sentry.Integrations.RewriteFrames plugin: https://docs.sentry.io/platforms/javascript/#rewriteframes
  .tag(
    'plugin',
    '<script src="https://browser.sentry-cdn.com/5.12.1/rewriteframes.min.js" crossorigin="anonymous"></script>'
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

  var config = {
    dsn: this.options.config,
    environment: this.options.environment,
    release: customRelease || this.options.release,
    serverName: this.options.serverName,
    whitelistUrls: this.options.whitelistUrls,
    blacklistUrls: this.options.ignoreUrls,
    // ignoreErrors still exists, but is not documented on Sentry's website
    // https://github.com/getsentry/sentry-javascript/blob/master/packages/core/src/integrations/inboundfilters.ts#L12
    ignoreErrors: this.options.ignoreErrors,
    integrations: [],
    debug: this.options.debug
  };

  var logger = this.options.logger;
  var includePaths = [];
  if (this.options.includePaths.length > 0) {
    includePaths = this.options.includePaths.map(function(path) {
      var regex;
      try {
        regex = new RegExp(path);
      } catch (e) {
        // do nothing
      }
      return regex;
    });
  }

  var self = this;
  this.load('sentry', function() {
    self.load('plugin', function() {
      // values from `includePaths` tells the Sentry app which frames in a StackTrace to display in the user's
      // dashboard. we use the Sentry.Integrations.RewriteFrames plugin to check each frame in a stacktrace and reassign
      // the value of frame.in_app to true/false depending on whether we find a match: https://docs.sentry.io/platforms/javascript/#rewriteframes
      if (includePaths.length > 0) {
        config.integrations.push(
          new window.Sentry.Integrations.RewriteFrames({
            iteratee: function(frame) {
              for (var i = 0; i < includePaths.length; i++) {
                try {
                  if (frame.filename.match(includePaths[i])) {
                    frame.in_app = true; // eslint-disable-line
                    return frame;
                  }
                } catch (e) {
                  // do nothing
                }
              }
              frame.in_app = false; // eslint-disable-line
              return frame;
            }
          })
        );
      }

      window.Sentry.init(reject(config));

      if (logger) {
        window.Sentry.setTag('logger', logger);
      }

      self.ready();
    });
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
