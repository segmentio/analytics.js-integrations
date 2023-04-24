'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

var ConvertFlow = module.exports = integration('ConvertFlow')
  .global('convertflow')
  .assumesPageview()
  .option('websiteId', '')
  .tag('<script src="https://js.convertflow.co/production/websites/{{ websiteId }}.js"></script>');


ConvertFlow.prototype.initialize = function() {
  this.load(this.ready);
};

ConvertFlow.prototype.loaded = function() {
	return !!window.convertflow && Object.keys(window.convertflow).length > 0;
};

ConvertFlow.prototype.page = function(page) {
	window.convertflow.start();
};

ConvertFlow.prototype.identify = function (i) {
  var email = i.email();

  if (email) {
  	var payload = {email: email, override: true}

  	if (window.convertflow && window.convertflow.person) {
  		window.convertflow.identify(payload);
  	} else {
  		window.addEventListener("cfReady", function() {
	    	window.convertflow.identify(payload);
	    });;
  	}
  }
};