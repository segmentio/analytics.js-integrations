'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var sandbox = require('@segment/clear-env');
var Elevio = require('../lib/');

describe('Elevio', function() {
  var analytics;
  var elevio;
  var options = {
    accountId: 'konami'
  };

  beforeEach(function() {
    analytics = new Analytics();
    elevio = new Elevio(options);
    analytics.use(Elevio);
    analytics.use(tester);
    analytics.add(elevio);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    elevio.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Elevio,
      integration('Elevio')
        .global('_elev')
        .option('accountId', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(window, '_elev');
      analytics.stub(elevio, 'load');
    });
    describe('#initialize', function() {
      it('should create window._elev', function() {
        analytics.initialize();
        analytics.assert(window._elev instanceof Object);
      });
      it('should call #load', function() {
        analytics.initialize();
        analytics.called(elevio.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(elevio, done);
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
        // TODO: stub the integration global api.
        // For example:
        // analytics.stub(window.api, 'identify');
      });

      it('should send an email', function() {
        analytics.identify('id', { email: 'name@example.com' });
        analytics.assert(window._elev.user.email === 'name@example.com');
      });

      it('should send a full name', function() {
        analytics.identify('id', { name: 'Test Person' });
        analytics.assert(window._elev.user.name === 'Test Person');
      });

      it('should not send name', function() {
        analytics.identify('id');
        analytics.assert(window._elev.user.name === undefined);
      });

      // TODO seems Identify.prototype.name returns nothing when no last name is sent
      // it('should send a first name', function() {
      // analytics.identify(undefined, { firstName: 'Test' });
      // analytics.assert(window._elev.user.name === 'Test');
      // });

      it('should send a combined name', function() {
        analytics.identify('id', { firstName: 'Test', lastName: 'Person' });
        analytics.assert(window._elev.user.name === 'Test Person');
      });

      it('should send their plan as plan and group', function() {
        analytics.identify('id', { plan: 'gold' });
        analytics.assert(window._elev.user.plan instanceof Array);
        analytics.assert(window._elev.user.plan[0] === 'gold');
        analytics.assert(window._elev.user.groups[0] === 'gold');
      });

      it('should send traits when custrom keys are provided', function() {
        analytics.identify('id', { locale: 'en_US' });
        analytics.assert(window._elev.user.traits instanceof Object);
        analytics.assert(window._elev.user.traits.hasOwnProperty('locale'));
        analytics.assert(window._elev.user.traits.locale === 'en_US');
      });

      it('should not send traits when no trait information is present', function() {
        analytics.identify('id', {
          firstName: 'Test',
          lastName: 'Person',
          email: 'test@email.com'
        });
        analytics.assert(!(window._elev.user.traits instanceof Object));
      });

      it('should remove reserved keys from the trait if without removing unreserved keys', function() {
        analytics.identify('id', { firstName: 'Test', locale: 'en_US' });
        analytics.assert(window._elev.user.traits instanceof Object);
        analytics.assert(!window._elev.user.traits.hasOwnProperty('firstName'));
        analytics.assert(window._elev.user.traits.locale === 'en_US');
      });
    });
  });
});
