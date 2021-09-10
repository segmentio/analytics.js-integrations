'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var assert = require('proclaim');
var fmt = require('@segment/fmt');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var url = require('component-url');
var when = require('do-when');
var Marketo = require('../lib/');

/**
 * FIXME: Note that some tests will fail if you do not have Marketo enabled in your integration settings
 * for the project Pk6s0Q47fC
 */

describe('Marketo', function() {
  var analytics;
  var marketo;
  var options = {
    projectId: 'Pk6s0Q47fC',
    accountId: '332-UOQ-444',
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

  beforeEach(function() {
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
        .option('traits', [])
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(marketo, 'load');
      analytics.stub(marketo, 'forms');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
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
      analytics.initialize();
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
        analytics.user().anonymousId('fc42baa7-6aa4-4500-9ebb-0548762a6ac8');
        analytics.spy(marketo, 'requestHash');
        analytics.stub(window, 'mktoMunchkinFunction');
      });

      it('should call window.mktoMunchkinFunction', function(done) {
        analytics.identify(
          'id',
          { email: 'name@example.com' },
          { Marketo: true }
        );
        analytics.equal(marketo.requestHash.args[0][0], 'name@example.com');
        when(function() {
          return window.mktoMunchkinFunction.called;
        }, done);
      });

      it('should not call `.requestHash` without an email', function() {
        analytics.identify('id', {}, { Marketo: true });
        analytics.didNotCall(marketo.requestHash);
      });

      it('should return out if Marketo is disabled', function() {
        analytics.identify(
          'name@example.com',
          {},
          { integrations: { Marketo: false } }
        );
        analytics.didNotCall(marketo.requestHash);
      });

      it('should grab email from id', function(done) {
        analytics.identify('name@example.com', {}, { Marketo: true });
        analytics.equal(marketo.requestHash.args[0][0], 'name@example.com');
        when(function() {
          return window.mktoMunchkinFunction.called;
        }, done);
      });

      it('should call window.mktoMunchkinFunction with special traits', function(done) {
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
        analytics.assert(marketo.requestHash.calledWith('name@example.com'));
        when(
          function() {
            return window.mktoMunchkinFunction.called;
          },
          function() {
            // XXX: Trying to figure out why your spec is failing? Throwing
            // uncaught exceptions? It's this! This assert is probably failing.
            // I'm ashamed to have touched this code.
            // TODO: Rewrite this to synchronously stub `requestHash` so we don't
            // have to do this crap
            analytics.assert(
              window.mktoMunchkinFunction.calledWith('associateLead', {
                Mylittleponyz: 'something',
                userId: 'id',
                Company: 'Marketo',
                Email: 'name@example.com',
                FirstName: 'Prateek',
                LastName: 'Srivastava',
                Phone: '123-456-7890',
                Fax: '555-555-5555',
                City: 'San Francisco',
                Country: 'USA',
                PostalCode: '94103',
                State: 'California',
                anonymousId: 'fc42baa7-6aa4-4500-9ebb-0548762a6ac8'
              })
            );
            done();
          }
        );
      });

      it('should call window.mktoMunchkinFunction with string address', function(done) {
        analytics.identify(
          'name@example.com',
          { address: 'SF, CA, USA' },
          { Marketo: true }
        );
        when(
          function() {
            return window.mktoMunchkinFunction.called;
          },
          function() {
            // XXX: Trying to figure out why your spec is failing? Throwing
            // uncaught exceptions? It's this! This assert is probably failing.
            // I'm ashamed to have touched this code.
            // TODO: Rewrite this to synchronously stub `requestHash` so we don't
            // have to do this crap
            analytics.assert(
              window.mktoMunchkinFunction.calledWith('associateLead', {
                userId: 'name@example.com',
                Address: 'SF, CA, USA',
                Email: 'name@example.com',
                anonymousId: 'fc42baa7-6aa4-4500-9ebb-0548762a6ac8'
              })
            );
            done();
          }
        );
      });
    });

    describe('#emailHashUrl', function() {
      it('should return the proper url', function() {
        var email = 'email@domain.com';
        var url = marketo.emailHashUrl(email);
        assert.equal(
          url,
          fmt(
            'https://api.segment.io/integrations/marketo/v1/%s/%s/hash-v2',
            options.projectId,
            email
          )
        );
      });
    });
  });
});
