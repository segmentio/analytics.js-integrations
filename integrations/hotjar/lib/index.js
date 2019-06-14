'use strict';

var integration = require('@segment/analytics.js-integration');
var is = require('is');

/**
 * Expose `HotJar` integration
 */

var Hotjar = (module.exports = integration('Hotjar')
  .option('hjid', null)
  .option('hjPlaceholderPolyfill', true));

/**
 * Initialize HotJar
 */

Hotjar.prototype.initialize = function() {
  // Make sure our metadata inputs are valid, putting out a console error and aborting if not.
  function areOptionsValid(options) {
    var validators = {
      isHjidValid:
        is.number(options.hjid) && !is.nan(options.hjid) && options.hjid !== 0, // Make sure that HJID is a number (and isn't NaN)
      isPlaceholderPolyfillValid: is.bool(options.hjPlaceholderPolyfill) // Make sure we received a boolean.
    };

    for (var validator in validators) {
      if (!validators[validator]) {
        console.warn(
          'Hotjar Integration - ' + validator + ' returned false, not loading.'
        );
        return false;
      }
    }

    return true;
  }

  // Convert from string to number.
  this.options.hjid = Number(this.options.hjid);
  if (!areOptionsValid(this.options)) return;

  window._hjSelf = this;

  // Load HotJar snippet - for some reason, trying to load in .tag() was unsuccessful - directly loading script here.
  (function(h, o, t, j, a, r) {
    h.hj =
      h.hj ||
      function() {
        (h.hj.q = h.hj.q || []).push(arguments);
      };
    h._hjSettings = {
      hjid: h._hjSelf.options.hjid,
      hjsv: 5,
      hjPlaceholderPolyfill: h._hjSelf.options.hjPlaceholderPolyfill
    };
    a = o.getElementsByTagName('head')[0];
    r = o.createElement('script');
    r.async = 1;
    r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
    a.appendChild(r);
  })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

  this.ready();
};
