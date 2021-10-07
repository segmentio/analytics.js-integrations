'use strict';

var integration = require('@segment/analytics.js-integration');
var Identify = require('segmentio-facade').Identify;

var ProfitWell = module.exports = integration('ProfitWell')
    .global('profitwell')
    .option('publicApiToken')
    .option('siteType', 'marketing')
    .tag('<script src="https://public.profitwell.com/js/profitwell.js?auth={{publicApiToken}}">');

ProfitWell.prototype.initialize = function() {
  window.profitwell = window.profitwell || function() {
    window.profitwell.q = window.profitwell.q || [];
    window.profitwell.q.push(arguments);
  };

  var user = this.analytics.user();
  var traits = user.traits() || {};
  var id = new Identify({ traits: traits });
  var email = id.email();

  window.profitwell('auth_token', this.options.publicApiToken);

  if (email) {
    this.start(email);
  } 

  if (this.options.siteType === 'marketing') {
    this.start();
  }

  this.load(this.ready);
};

ProfitWell.prototype.identify = function(identify) {
  if (identify.email()) {
    this.start(identify.email());
  } else {
    this.start();
  }
};

ProfitWell.prototype.start = function(email) {
  if (this.started) {
    return;
  }

  var args = email ? { user_email: email } : {};
  window.profitwell('start', args);
  this.started = true;
};
