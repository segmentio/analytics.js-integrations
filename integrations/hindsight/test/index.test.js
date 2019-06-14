'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Hindsight = require('../lib');

describe('Hindsight', function() {
  var analytics;
  var hindsight;
  var options = {
    pixel_code:
      'cHVzaG1haWx8NDQ2MDM5OHw0NDYwMzkyOjY1NzU2OXw0NDYwMzkzOjY1NzU2OHw0NDYwMzk5'
  };

  beforeEach(function() {
    analytics = new Analytics();
    hindsight = new Hindsight(options);
    analytics.use(Hindsight);
    analytics.use(tester);
    analytics.add(hindsight);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    hindsight.reset();
    sandbox();
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(hindsight, 'load');
      analytics.initialize();
    });

    afterEach(function() {
      hindsight.reset();
    });

    describe('#initialize', function() {
      it('should call load on initialize', function() {
        analytics.called(hindsight.load);
      });

      it('should set the correct source', function() {
        analytics.equal(window.RB.source, options.pixel_code);
      });

      it('should set disablePushState to true', function() {
        analytics.equal(window.RB.disablePushState, true);
      });

      it('should create track object', function() {
        analytics.assert(window.RB.track instanceof Function);
      });

      it('should queue events to be tracked', function() {
        window.RB.track('view');
        analytics.assert(window.RB.queue.length === 1);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(hindsight, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.RB, 'track');
      });

      it('should track a pageview and props', function() {
        analytics.page({ custom: 'blues eyes white dragon' });
        analytics.called(window.RB.track, 'view', {
          custom: 'blues eyes white dragon',
          path: location.pathname,
          referrer: document.referrer,
          search: location.search,
          title: document.title,
          url: location.href
        });
      });

      it('should stringify props that are objects', function() {
        analytics.page({ stringifythis: { a: 'b' } });
        analytics.called(window.RB.track, 'view', {
          path: location.pathname,
          referrer: document.referrer,
          search: location.search,
          title: document.title,
          url: location.href,
          stringifythis: '{"a":"b"}'
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.RB, 'track');
      });

      describe('event not mapped to legacy or standard', function() {
        it('should send a custom event', function() {
          analytics.track('view');
          analytics.called(window.RB.track, 'view');
        });

        it('should send a custom event and properties', function() {
          analytics.track('custom_event', { property: true });
          analytics.called(window.RB.track, 'custom_event', { property: true });
        });

        it('should send properties correctly', function() {
          analytics.track('event', {
            currency: 'XXX',
            property: true,
            stringifythis: { a: 'b' }
          });
          analytics.called(window.RB.track, 'event', {
            currency: 'XXX',
            property: true,
            stringifythis: '{"a":"b"}'
          });
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.RB, 'track');
      });

      describe('event not mapped to legacy or standard', function() {
        it('should send a custom event', function() {
          analytics.identify('id');
          analytics.called(window.RB.track, 'identify', { id: 'id' });
        });

        it('should send traits with an email', function() {
          analytics.identify({ email: 'name@example.com' });
          analytics.called(window.RB.track, 'identify', {
            email: 'name@example.com'
          });
        });

        it('should send an id and traits with an email', function() {
          analytics.identify('id', { email: 'name@example.com' });
          analytics.called(window.RB.track, 'identify', {
            id: 'id',
            email: 'name@example.com'
          });
        });
      });
    });
  });
});
