'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var when = require('do-when');
var url = require('component-url');
var Marketo = require('../lib/');

/**
 * FIXME: Note that some tests will fail if you do not have Marketo enabled in your integration settings
 * for the project Pk6s0Q47fC
 */

describe('Marketo', function() {
  var analytics;
  var marketo;
  var options;

  beforeEach(function() {
    options = {
      projectId: 'Pk6s0Q47fC',
      accountId: 'app-ab28.marketo.com',
      marketoFormId: '1003',
      marketoHostUrl: 'app-ab28.marketo.com',
      traits: [
        {
          key: 'customTrait',
          value: {
            segmentTrait: 'customTrait',
            marketoFieldName: 'Mylittleponyz',
            marketoFieldType: 'string'
          }
        },
        {
          key: 'fax',
          value: {
            segmentTrait: 'fax',
            marketoFieldName: 'fax',
            marketoFieldType: 'number'
          }
        }
      ]
    };

    analytics = new Analytics();
    marketo = new Marketo(options);
    analytics.use(Marketo);
    analytics.use(tester);
    analytics.add(marketo);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    marketo.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Marketo,
      integration('Marketo V2')
        .assumesPageview()
        .global('Munchkin')
        .global('MktForms2')
        .option('host', 'https://api.segment.io')
        .option('accountId', '')
        .option('projectId', '')
        .option('marketoHostUrl', '')
        .option('marketoFormId', '')
        .option('traits', [])
        .tag('<script src="//munchkin.marketo.net/munchkin-beta.js">')
        .tag(
          'forms',
          '<script src="//{{marketoHostUrl}}/js/forms2/js/forms2.min.js">'
        )
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(marketo, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize(options);
        analytics.page({}, { Marketo: true });
        analytics.called(marketo.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(marketo, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize(options);
      analytics.page({}, { Marketo: true });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'mktoMunchkinFunction');
      });

      it('should call munchkin', function() {
        analytics.page({}, { Marketo: true });
        analytics.called(window.mktoMunchkinFunction, 'visitWebPage', {
          url: window.location.href,
          params: window.location.search.slice(1)
        });
      });

      it('should call munchkin with a named page', function() {
        analytics.page('Signup', {}, { Marketo: true });
        analytics.called(window.mktoMunchkinFunction, 'visitWebPage', {
          url: window.location.href,
          params: window.location.search.slice(1)
        });
      });

      it('should call munchkin with a specific url', function() {
        var parsed = url.parse();
        analytics.page(
          'Signup',
          { url: 'http://example.com' },
          { Marketo: true }
        );
        analytics.called(window.mktoMunchkinFunction, 'visitWebPage', {
          url: 'http://example.com',
          params: parsed.query
        });
      });

      it('should return out if Marketo is disabled', function() {
        analytics.page({}, { integrations: { Marketo: false } });
        analytics.didNotCall(window.mktoMunchkinFunction);
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.spy(marketo, 'setupAndSubmitForm');
        analytics.stub(window.MktoForms2, 'loadForm');
        analytics.stub(window.MktoForms2, 'whenReady');
      });

      it('should return out if Marketo is disabled', function() {
        analytics.identify(
          'name@example.com',
          {},
          { integrations: { Marketo: false } }
        );
        analytics.didNotCall(window.MktoForms2.loadForm);
      });

      it('should return out if no email is passed', function() {
        analytics.identify('', {}, { integrations: { Marketo: false } });
        analytics.didNotCall(window.MktoForms2.loadForm);
      });

      it('should submit form with traits', function(done) {
        var traits = {
          email: 'name@example.com',
          company: 'Marketo',
          firstName: 'Prateek',
          lastName: 'Srivastava',
          industry: 'SaaS',
          phone: '123-456-7890',
          fax: '555-555-5555',
          address: {
            city: 'San Francisco',
            country: 'USA',
            postalCode: '94103',
            state: 'California'
          },
          customTrait: 'something'
        };

        analytics.identify('id', traits, { Marketo: true });

        when(
          function() {
            var callToMkto = window.MktoForms2.loadForm.called;
            done();
            return callToMkto;
          },
          function() {
            var callToMkto = window.MktoForms2.whenReady.called;
            done();
            return callToMkto;
          },
          function() {
            analytics.called(marketo.setupAndSubmitForm, traits);
            done();
          }
        );
      });
    });
  });
});
