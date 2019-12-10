'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * UMD?
 */

var umd = typeof window.define === 'function' && window.define.amd;

/**
 * Expose `Madkudu` integration.
 */

var MadKudu = module.exports = integration('Madkudu')
  .global('madkudu')
  .option('apiKey', '')
  .readyOnLoad()
  .tag('<script src="//cdn.madkudu.com/madkudu.js/v1/{{ apiKey }}/madkudu.min.js">');

/**
 * Initialize.
 *
 * https://github.com/MadKudu/madkudu.js
 *
 * @api public
 */

MadKudu.prototype.initialize = function() {
  /* eslint-disable */
  !function(){var madkudu=window.madkudu=window.madkudu||[];if(!madkudu.initialize)if(madkudu.invoked)window.console&&console.error&&console.error("MadKudu snippet included twice.");else{madkudu.invoked=!0;madkudu.methods=["identify","reset","group","ready","page","track","once","on"];;madkudu.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);madkudu.push(e);return madkudu}};for(var t=0;t<madkudu.methods.length;t++){var e=madkudu.methods[t];madkudu[e]=madkudu.factory(e)}
    madkudu.SNIPPET_VERSION="0.3.0";
  }}();
  /* eslint-enable */

  var self = this;

  if (umd) {
    window.require(['//cdn.madkudu.com/madkudu.js/v1/' + self.options.apiKey + '/madkudu.min.js'], function(madkudu) {
      window.madkudu = madkudu;
      self.ready();
    });
    return;
  }

  this.load({ apiKey: this.options.apiKey }, function() {
    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

MadKudu.prototype.loaded = function() {
  return !!(window.madkudu && window.madkudu.options);
};

/**
 * {Page}.
 *
 * @api public
 * @param {Facade} page
 */

MadKudu.prototype.page = function() {
  window.madkudu.page();
};

/**
 * Identify.
 *
 * @api public
 * @param {Facade} identify
 */

MadKudu.prototype.identify = function(identify) {
  var id = identify.userId();
  var traits = identify.traits();
  if (id) {
    window.madkudu.identify(id, traits);
  } else {
    window.madkudu.identify(traits);
  }
};
