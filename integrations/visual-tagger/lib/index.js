/**
 * Module dependencies.
 */
var integration = require('@segment/analytics.js-integration');
var TracktorLib = require('@segment/tracktor');
var when = require('do-when');

/**
 * Expose `Visual Tagger` integration.
 */

var Tracktor = (module.exports = integration('Visual Tagger')
  .global('Tracktor')
  .option('workspaceId', '')
  .option('sourceId', '')
  .option('instrumentationSpec', []));

/**
 * Initialize.
 *
 * @api public
 */

Tracktor.prototype.initialize = function() {
  var tracktor = new TracktorLib(
    this.options.workspaceId,
    this.options.sourceId,
    this.options.instrumentationSpec,
    window.document
  );
  window.Tracktor = TracktorLib;

  when(this.loaded, this.ready);

  tracktor.start();
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Tracktor.prototype.loaded = function() {
  return window.Tracktor.instance.isInitialized();
};
