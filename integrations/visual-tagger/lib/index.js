/**
 * Module dependencies.
 */
// var TracktorLib = require('@segment/tracktor');
var integration = require('@segment/analytics.js-integration');
var TracktorLib = require('@segment/tracktor');

/**
 * Expose `Tracktor` integration.
 */

var Tracktor = (module.exports = integration('Tracktor')
  .global('Tracktor')
  .option('workspaceId', '')
  .option('sourceId', ''));

/**
 * Initialize.
 *
 * @api public
 */

Tracktor.prototype.initialize = function() {
  var tracktor = new TracktorLib(
    this.options.workspaceId,
    this.options.sourceId,
    window.document
  );
  window.Tracktor = TracktorLib;

  tracktor.start();
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Tracktor.prototype.loaded = function() {
  return window.Tracktor.instance.initialized;
};
