'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var useHttps = require('use-https');
var trample = require('@segment/trample');

/**
 * Expose `Comscore` integration.
 */

var Comscore = (module.exports = integration('comScore')
  .global('_comscore')
  .global('COMSCORE')
  .option('c1', '2')
  .option('c2', '')
  .option('comscorekw', '')
  .option('consentFlag', '')
  .tag('https', '<script src="https://sb.scorecardresearch.com/cs/{{ c2 }}/beacon.js">')
  .tag('http', '<script src="https://sb.scorecardresearch.com/cs/{{ c2 }}/beacon.js">'));

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
  window._comscore = window._comscore || [];

  if (Object.keys(this.comScoreParams).length > 0) {
    window._comscore.push(this.comScoreParams);
  }

  var tagName = useHttps() ? 'https' : 'http';
  this.load(tagName, this.ready);
};

Comscore.prototype.mapComscoreParams = function(page) {
  var beaconParamMap = this.options.beaconParamMap;
  var properties = page.properties();
  var flatProperties = trample(page.properties());
  var flatContext = trample(page.context());
  var consentValue;

  var comScoreParams = {};

  Object.keys(beaconParamMap).forEach(function(property) {
    if (property in properties) {
      var key = beaconParamMap[property];
      var value = properties[property];
      comScoreParams[key] = value;
    }
  });

  if (this.options.consentFlag) {
    if (flatProperties.hasOwnProperty(this.options.consentFlag)) {
      consentValue = page.proxy('properties.' + this.options.consentFlag)
    } else if (flatContext.hasOwnProperty(this.options.consentFlag)) {
      consentValue = page.proxy('context.' + this.options.consentFlag)
    }
    if (
      consentValue !== undefined &&
      !(
        String(consentValue).match(/^1(-|Y|N){3}/g) &&
        String(consentValue).split('')[2] === '-'
      )
    ) {
      if (
        String(consentValue) === 'true' ||
        String(consentValue) === '1' ||
        (String(consentValue).match(/^1(-|Y|N){3}/g) &&
          String(consentValue).split('')[2] === 'N')
      ) {
        consentValue = '1';
      } else if (
        String(consentValue) === 'false' ||
        String(consentValue) === '0' ||
        (String(consentValue).match(/^1(-|Y|N){3}/g) &&
          String(consentValue).split('')[2] === 'Y')
      ) {
        consentValue = '0';
      } else {
        consentValue = '';
      }
      comScoreParams.cs_ucfr = consentValue;
    }
  }

  comScoreParams.c1 = this.options.c1;
  comScoreParams.c2 = this.options.c2;
  if (this.options.comscorekw.length) {
    comScoreParams.comscorekw = this.options.comscorekw;
  }

  return comScoreParams;
};
