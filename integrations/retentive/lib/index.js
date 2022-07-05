'use strict';

/**
 * Module dependencies.
 */
const integration = require('@segment/analytics.js-integration');

/**
 * Expose `Retentive` integration.
 */
const Retentive = integration('Retentive')
  .readyOnInitialize()
  .readyOnLoad()
  .global('retentive')
  .option('workspaceId', null);

/**
 * Validate `workspaceId` provided as option and load.
 */
Retentive.prototype.initialize = function() {
  const { workspaceId } = this.options;
  if (!workspaceId) {
    throw new Error('Retentive workspaceId is required');
  }
  this.load(this.ready);
};

/**
 * Load the Retentive library.
 */
Retentive.prototype.load = function(cb) {
  const { workspaceId } = this.options;
  const win = window;
  if (!win.retentive) {
    const doc = document;
    const retentive = (win.retentive = {
      loaded: false,
      _: []
    });
    const methods = ['onLoad', 'open', 'identify'];
    methods.forEach(method => {
      retentive[method] = function() {
        retentive._.push([method, arguments]);
      };
    });

    const attachScript = () => {
      const script = doc.createElement('script');
      script.id = 'retentive-widget';
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://companion.retentive.io/widget.js';
      script.dataset.workspaceId = workspaceId;
      doc.head.appendChild(script);
    };
    if (doc.readyState === 'complete') {
      attachScript();
    } else {
      win.addEventListener('load', attachScript);
    }
  }
  cb();
};

/**
 * Loaded?
 *
 * @return {boolean}
 */
Retentive.prototype.loaded = function() {
  return !!window.retentive;
};

/**
 * Identify.
 *
 * @param {Identify} identify
 */
Retentive.prototype.identify = function(identify) {
  const userId = identify.userId();
  if (userId) {
    window.retentive.identify(String(userId));
  }
};

module.exports = Retentive;
