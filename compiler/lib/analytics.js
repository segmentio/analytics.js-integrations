/*
 * Module dependencies.
 */

var analytics = require('@segment/analytics.js-core');

/*
 * Exports.
 */

module.exports = function(Integrations) {
  for (let integration in Integrations) {
    analytics.use(Integrations[integration]);
  }

  return analytics;
};
