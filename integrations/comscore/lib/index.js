'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var useHttps = require('use-https');

/**
 * Expose `Comscore` integration.
 */

var Comscore = module.exports = integration('comScore')
  .global('_comscore')
  .global('COMSCORE')
  .option('c1', '2')
  .option('c2', '')
  .tag('http', '<script src="http://b.scorecardresearch.com/beacon.js">')
  .tag('https', '<script src="https://sb.scorecardresearch.com/beacon.js">');

/**
 * Initialize.
 *
 * @api public
 *
 * Does not load script until `page` is called to capture the params on
 * that initial `page` and pass it in on the inferred native comScore.
 */

Comscore.prototype.initialize = function() {
  this.pageCalledYet = false;
  this._ready = true; // temporarily switch ready to true so single page call can fire
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

Comscore.prototype.loaded = function() {
  return !!window.COMSCORE;
};

/**
 * Page.
 *
 * @api public
 * @param {Object} page
 */

Comscore.prototype.page = function(page) {
  this.comScoreParams = this.mapComscoreParams(page);
  
  if (!this.pageCalledYet) {
    this._ready = false;
    this.pageCalledYet = true;
    this._initialize();
  } else {
    window.COMSCORE.beacon(this.comScoreParams);
  }
};

Comscore.prototype._initialize = function() {
  window._comscore = window._comscore || [this.comScoreParams];
  var tagName = useHttps() ? 'https' : 'http';
  this.load(tagName, this.ready);
};


Comscore.prototype.mapComscoreParams = function(page) {
  var beaconParamMap = this.options.beaconParamMap;
  var properties = page.properties();

  var comScoreParams = {};

  Object.keys(beaconParamMap).forEach(function(property) {
    if (property in properties) {
      var key = beaconParamMap[property];
      var value = properties[property];
      comScoreParams[key] = value;
    }
  });

  comScoreParams.c1 = this.options.c1;
  comScoreParams.c2 = this.options.c2;

  return comScoreParams;
};
