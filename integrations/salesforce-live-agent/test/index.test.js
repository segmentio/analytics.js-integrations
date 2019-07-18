'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var SalesforceLiveAgent = require('../lib/');

describe('Salesforce Live Agent', function() {
  var analytics;
  var salesforceLiveAgent;
  var options = {
    hostname: 'c.la3-c1cs-phx',
    liveAgentEndpointUrl: 'd.la3-c1cs-phx',
    enableLogging: false,
    orgId: '00D3D000000DIdG',
    deploymentId: '5723D00000000F4',
    contactMappings: [
      {
        key: 'email',
        value: {
          trait: 'email',
          label: 'User Email',
          displayToAgent: true,
          fieldName: 'Email',
          doFind: true,
          isExactMatch: true,
          doCreate: true
        }
      },
      {
        key: 'lastName',
        value: {
          trait: 'lastName',
          label: 'Last Name',
          displayToAgent: true,
          fieldName: 'LastName',
          doFind: false,
          isExactMatch: true,
          doCreate: false
        }
      }
    ],
    caseMappings: [
      {
        key: 'caseStatus',
        value: {
          property: 'caseStatus',
          label: 'Case Status',
          displayToAgent: true,
          fieldName: 'Status',
          doFind: false,
          isExactMatch: false,
          doCreate: false
        }
      },
      {
        key: 'subject',
        value: {
          property: 'subject',
          label: 'Subject',
          displayToAgent: true,
          fieldName: 'CaseSubject',
          doFind: false,
          isExactMatch: false,
          doCreate: false
        }
      }
    ],
    accountMappings: [
      {
        key: 'website',
        value: {
          property: 'website',
          label: 'Account Website',
          displayToAgent: true,
          fieldName: 'Website',
          doFind: false,
          isExactMatch: false,
          doCreate: false
        }
      },
      {
        key: 'revenue',
        value: {
          property: 'revenue',
          label: 'Account Revenue',
          displayToAgent: true,
          fieldName: 'AnnualRevenue',
          doFind: false,
          isExactMatch: false,
          doCreate: false
        }
      }
    ]
  };

  beforeEach(function() {
    analytics = new Analytics();
    salesforceLiveAgent = new SalesforceLiveAgent(options);
    analytics.use(SalesforceLiveAgent);
    analytics.use(tester);
    analytics.add(salesforceLiveAgent);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    salesforceLiveAgent.reset();
    sandbox();
    window.liveAgentDeployment = undefined;
  });

  it('should store the proper settings', function() {
    analytics.compare(
      SalesforceLiveAgent,
      integration('Salesforce Live Agent')
        .global('liveagent')
        .option('deploymentId', '')
        .option('liveAgentEndpointUrl', '')
        .option('orgId', '')
        .option('hostname', '')
        .option('enableLogging', false)
        .option('contactMappings', [])
        .option('accountMappings', [])
        .option('caseMappings', [])
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(salesforceLiveAgent, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(salesforceLiveAgent.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(salesforceLiveAgent, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('Live Chat Conversation Started', function() {
      beforeEach(function() {
        analytics.stub(window.liveagent, 'addCustomDetail');
        analytics.stub(window.liveagent, 'setName');
        analytics.stub(window.liveagent, 'init');
      });

      it('should add custom details from the traits object', function() {
        var contactMappings = options.contactMappings;
        var traits = { email: 'chris.nixon@segment.com', lastName: 'Nixon' };

        analytics.identify('ccnixon', traits);
        analytics.track('Live Chat Conversation Started', {});

        contactMappings.forEach(function(mapping) {
          mapping = mapping.value;
          var trait = traits[mapping.trait];
          analytics.called(
            window.liveagent.addCustomDetail,
            mapping.label,
            trait,
            mapping.displayToAgent
          );
        });
      });

      it('should set to users name if firstName and lastName are defined traits', function() {
        var traits = {
          email: 'chris.nixon@segment.com',
          firstName: 'Chris',
          lastName: 'Nixon'
        };

        analytics.identify('ccnixon', traits);
        analytics.track('Live Chat Conversation Started', {});
        analytics.called(window.liveagent.setName, 'Chris Nixon');
      });

      it('should omit traits that are not mapped', function() {
        var traits = {
          email: 'chris.nixon@segment.com',
          lastName: 'Nixon',
          nonMappedTrait: true
        };
        analytics.identify('ccnixon', traits);
        analytics.track('Live Chat Conversation Started');
        analytics.didNotCall(
          window.liveagent.addCustomDetail,
          undefined,
          true,
          undefined
        );
      });

      it('should add case details from the track event properties', function() {
        var caseMappings = options.caseMappings;
        var props = { caseStatus: 'Pending', subject: 'New shoes' };
        analytics.track('Live Chat Conversation Started', props);
        caseMappings.forEach(function(mapping) {
          mapping = mapping.value;
          var prop = props[mapping.property];
          analytics.called(
            window.liveagent.addCustomDetail,
            mapping.label,
            prop,
            mapping.displayToAgent
          );
        });
      });

      it('should add account details from group properties', function() {
        var accountMappings = options.accountMappings;
        var props = { website: 'segment.com', revenue: 100 };
        analytics.group(props);
        analytics.track('Live Chat Conversation Started', {});
        accountMappings.forEach(function(mapping) {
          mapping = mapping.value;
          var prop = props[mapping.property];
          analytics.called(
            window.liveagent.addCustomDetail,
            mapping.label,
            prop,
            mapping.displayToAgent
          );
        });
      });

      it('should initiatlize with the correct endpoint and ids', function() {
        analytics.track('Live Chat Conversation Started');
        var endpoint = 'https://d.la3-c1cs-phx.salesforceliveagent.com/chat';
        analytics.called(
          window.liveagent.init,
          endpoint,
          options.deploymentId,
          options.orgId
        );
      });
    });
  });
});
