'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Crisp` integration.
 *
 * https://help.crisp.chat/en/article/how-to-use-dollarcrisp-javascript-sdk-10ud15y/
 */

var Crisp = (module.exports = integration('Crisp')
  .global('$crisp')
  .option('websiteId', '')
  .option('listen', false)
  .readyOnLoad());

/**
 * Initialize.
 */
Crisp.prototype.initialize = function() {
  var self = this;

  this.load(function() {
    self.ready();
  });
};

/**
 * Load
 */
Crisp.prototype.load = function(done) {
  if (window.$crisp) {
    return;
  }

  if (!this.options.websiteId) {
    return;
  }

  window.CRISP_WEBSITE_ID = this.options.websiteId;
  window.$crisp = [];

  var script = document.createElement('script');
  script.src = 'https://client.crisp.chat/l.js';
  script.async = 1;
  document.getElementsByTagName('head')[0].appendChild(script);

  window.$crisp.push(['on', 'session:loaded', done]);
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */
Crisp.prototype.loaded = function() {
  return (
    typeof window.$crisp === 'object' && typeof window.$crisp.is === 'function'
  );
};

Crisp.prototype.identify = function(identify) {
  if (identify.email()) {
    window.$crisp.push(['set', 'user:email', identify.email()]);
  }

  if (identify.name() || identify.firstName()) {
    window.$crisp.push([
      'set',
      'user:nickname',
      identify.name() || identify.firstName()
    ]);
  }

  if (identify.phone()) {
    window.$crisp.push(['set', 'user:phone', [identify.phone()]]);
  }

  if (identify.avatar()) {
    window.$crisp.push(['set', 'user:avatar', [identify.avatar()]]);
  }
};
