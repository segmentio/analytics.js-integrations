'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var qs = require('component-querystring');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Pardot = require('../lib/');

describe('Pardot', function() {
  var pardot;
  var analytics;
  var options = {
    projectId: 'apitest',
    piAId: '77777',
    piCId: '99999'
  };

  beforeEach(function() {
    analytics = new Analytics();
    pardot = new Pardot(options);
    analytics.use(Pardot);
    analytics.use(tester);
    analytics.add(pardot);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    pardot.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Pardot,
      integration('Pardot')
        .assumesPageview()
        .global('piAId')
        .global('piCId')
        .global('piTracker')
        .option('projectId', '')
        .option('piAId', '')
        .option('piCId', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(pardot, 'load');
    });

    afterEach(function() {
      pardot.reset();
    });

    describe('#initialize', function() {
      it('should set the pardot settings global', function() {
        analytics.assert(!window.piAId);
        analytics.assert(!window.piCId);
        analytics.initialize();
        analytics.page();
        analytics.equal(window.piAId, options.piAId);
        analytics.equal(window.piCId, options.piCId);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(pardot.load);
      });
    });

    describe('#loaded', function() {
      it('should test window.piTracker', function() {
        analytics.assert(!pardot.loaded());
        window.piTracker = {};
        analytics.assert(pardot.loaded());
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(pardot, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      it('should make a pardot request', function(done) {
        analytics.identify('id', { email: 'email@example.com' });
        setTimeout(function() {
          analytics.assert(madeRequestWith({ pi_email: 'email@example.com' }));
          done();
        }, 0);
      });

      it('shouldnt make a pardot request without an email', function(done) {
        analytics.identify('id');
        setTimeout(function() {
          analytics.assert(!madeRequestWith({ pi_email: undefined }));
          done();
        }, 0);
      });
    });
  });
});

// TODO: jank way to check
function madeRequestWith(variables) {
  variables = {
    account_id: '77777',
    campaign_id: '99999',
    pi_opt_in: undefined,
    ver: 3,
    visitor_id: undefined,
    ...variables
  }
  
  return !!document.querySelector(
    'script[src="http://pi.pardot.com/analytics?' +
      qs.stringify(variables) +
      '"]'
  );
}
