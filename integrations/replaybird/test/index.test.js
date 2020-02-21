'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var ReplayBird = require('../lib/');

describe('ReplayBird', function() {
  var analytics;
  var replaybird;
  var options = {
    siteKey: '7vrdFkeywUwS94YQXUTdBf0pPQHXNlcWihmo1gsKLBO',
    debug: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    replaybird = new ReplayBird(options);
    analytics.use(ReplayBird);
    analytics.use(tester);
    analytics.add(replaybird);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    replaybird.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      ReplayBird,
      integration('ReplayBird')
        .option('siteKey', '')
        .option('debug', false)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(replaybird, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.called(replaybird.load);
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.ReplayBird, 'identify');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.ReplayBird.identify, 'id', {});
      });

      it('should camel case custom props', function() {
        analytics.identify('id', {
          name: 'User123',
          email: 'example@acme.com',
          'First name': 'Eric',
          lastName: 'Brown'
        });
        analytics.called(
          window.ReplayBird.identify,
          'id',
          {
            name: 'User123',
            email: 'example@acme.com',
            firstName: 'Eric',
            lastName: 'Brown'
          }
        );
      });

      it('should map name and email', function() {
        analytics.identify('id', { name: 'Test', email: 'test@test.com' });
        analytics.called(
          window.ReplayBird.identify,
          'id',
          { name: 'Test', email: 'test@test.com' }
        );
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.ReplayBird, 'event');
      });

      it('should send track event name and properties', function() {
        analytics.track('my_event', { some_field: 'field_value' });
        analytics.called(
          window.ReplayBird.event,
          'my_event',
          { some_field: 'field_value' }
        );
      });
    });

  });
});
