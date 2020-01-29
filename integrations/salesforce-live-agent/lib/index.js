'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `Salesforce Live Agent` integration.
 */

var SalesforceLiveAgent = (module.exports = integration('Salesforce Live Agent')
  .global('liveagent')
  .option('deploymentId', '')
  .option('orgId', '')
  .option('enableLogging', false)
  .option('liveAgentEndpointUrl', '')
  .option('hostname', '')
  .option('contactMappings', [])
  .option('caseMappings', [])
  .option('accountMappings', [])
  .tag(
    '<script src="https://{{ hostname }}.salesforceliveagent.com/content/g/js/36.0/deployment.js">'
  ));

SalesforceLiveAgent.prototype.initialize = function() {
  this.load(
    function() {
      this.ready();
    }.bind(this)
  );
};

SalesforceLiveAgent.prototype.track = function(track) {
  if (track.event() !== 'Live Chat Conversation Started') return;

  var traits = this.analytics.user().traits();
  var group = this.analytics.group().traits();
  var properties = track.properties();
  var options = this.options;
  var caseMappings = options.caseMappings || [];
  var contactMappings = options.contactMappings || [];
  var accountMappings = options.accountMappings || [];
  var findOrCreate;

  function addCustomDetail(mapping, value) {
    var label = mapping.label;
    var displayToAgent = !!mapping.displayToAgent;
    var fieldName = mapping.fieldName;
    var doFind = !!mapping.doFind;
    var isExactMatch = !!mapping.isExactMatch;
    var doCreate = !!mapping.doCreate;
    window.liveagent.addCustomDetail(label, value, displayToAgent);
    findOrCreate.map(fieldName, label, doFind, isExactMatch, doCreate);
  }

  // Lookup user traits
  if (Object.keys(traits).length && contactMappings.length) {
    findOrCreate = window.liveagent.findOrCreate('Contact');
    contactMappings.forEach(function(mapping) {
      var m = mapping;
      m = m.value || m;
      var trait = m.trait;
      var value = traits[trait];
      addCustomDetail(m, value);
    });

    if (traits.firstName && traits.lastName) {
      window.liveagent.setName(traits.firstName + ' ' + traits.lastName);
    }
  }

  // Lookup case properties
  if (Object.keys(properties).length && caseMappings.length) {
    findOrCreate = window.liveagent.findOrCreate('Case');
    caseMappings.forEach(function(mapping) {
      var m = mapping.value || mapping;
      var propertyName = m.property;
      var value = properties[propertyName];
      addCustomDetail(m, value);
    });
  }

  // Lookup account properties
  if (Object.keys(group).length && accountMappings.length) {
    findOrCreate = window.liveagent.findOrCreate('Account');
    accountMappings.forEach(function(mapping) {
      var m = mapping.value || mapping;
      var propertyName = m.property;
      var value = group[propertyName];
      addCustomDetail(m, value);
    });
  }

  var endpoint =
    'https://' + options.liveAgentEndpointUrl + '.salesforceliveagent.com/chat';
  window.liveagent.init(endpoint, options.deploymentId, options.orgId);

  if (options.enableLogging) {
    window.liveagent.enableLogging();
  }
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

SalesforceLiveAgent.prototype.loaded = function() {
  return !!window.liveagent;
};
