'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `aginkedIn Insight Tag` integration.
 */

var Linkedin = (module.exports = integration('LinkedIn Insight Tag')
  .option('partnerId', '')
  .tag(
    '<script src="https://snap.licdn.com/li.lms-analytics/insight.min.js"></script>'
  ));

Linkedin.prototype.initialize = function() {
  // We require a Partner ID to run this integration.
  if (!this.options.partnerId) return;

  window._linkedin_data_partner_id = this.options.partnerId;

  this.load(this.ready);
};

Linkedin.prototype.loaded = function() {
  return window._linkedin_data_partner_id;
};
