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
    // To get rid of no-param-reassign, can be disabled from eslint rules as well.
    var h1 = h;
    var o1 = o;
    var t1 = t;
    var j1 = j;
    var a1 = a;
    var r1 = r;
    h1.hj =
      h1.hj ||
      function() {
        (h1.hj.q = h1.hj.q || []).push(arguments);
      };
    h1._hjSettings = {
      hjid: h1._hjSelf.options.hjid,
      hjsv: 6,
      hjPlaceholderPolyfill: h1._hjSelf.options.hjPlaceholderPolyfill
    };
    a1 = o1.getElementsByTagName('head')[0];
    r1 = o1.createElement('script');
    r1.async = 1;
    r1.src = t1 + h1._hjSettings.hjid + j1 + h1._hjSettings.hjsv;
    a1.appendChild(r1);
  })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

  this.ready();
};
