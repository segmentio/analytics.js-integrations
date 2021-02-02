'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Survicate = require('../lib/');

describe('Survicate', function() {
  var analytics;
  var survicate;
  var options = {
    workspaceKey: 'xMIeFQrceKnfKOuoYXZOVgqbsLlqYMGD'
  };

  beforeEach(function() {
    analytics = new Analytics();
    survicate = new Survicate(options);
    analytics.use(Survicate);
    analytics.use(tester);
    analytics.add(survicate);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    survicate.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Survicate, integration('Survicate')
      .global('_sva')
      .option('workspaceKey', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(survicate, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.called(survicate.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(survicate, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._sva, 'setVisitorTraits');
      });

      it('should send user_id', function() {
        analytics.identify('id');
        analytics.called(window._sva.setVisitorTraits, {
          user_id: 'id'
        });
      });

      it('should send email', function() {
        analytics.identify('id', { email: 'email@example.com' });
        analytics.called(window._sva.setVisitorTraits, {
          user_id: 'id',
          email: 'email@example.com'
        });
      });

      it('should send first and last name', function() {
        analytics.identify('id', { firstName: 'john', lastName: 'doe' });
        analytics.called(window._sva.setVisitorTraits, {
          user_id: 'id',
          first_name: 'john',
          last_name: 'doe'
        });
      });

      it('should send custom traits', function() {
        analytics.identify('id', { eyes: 'brown' });
        analytics.called(window._sva.setVisitorTraits, {
          user_id: 'id',
          eyes: 'brown'
        });
      });

      it('should flatten object traits', function() {
        analytics.identify('id', {
          address: {
            street: '6th St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94103',
            country: 'USA'
          }
        });
        analytics.called(window._sva.setVisitorTraits, {
          user_id: 'id',
          address_street: '6th St',
          address_city: 'San Francisco',
          address_state: 'CA',
          address_postal_code: '94103',
          address_country: 'USA'
        });
      });

      it('should drop arrays in traits', function() {
        analytics.identify('id', {
          stringifyMe: [{ a: 'b' }, { a: 'c' }]
        });
        analytics.called(window._sva.setVisitorTraits, {
          user_id: 'id'
        });
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window._sva,'setVisitorTraits');
      });

      it('should send group_id', function() {
        analytics.group('id');
        analytics.called(window._sva.setVisitorTraits, {
          group_id: 'id'
        });
      });

      it('should send custom traits', function() {
        analytics.group('id', { eyes: 'brown' });
        analytics.called(window._sva.setVisitorTraits, {
          group_id: 'id',
          group_eyes: 'brown'
        });
      });

      it('should flatten object traits', function() {
        analytics.group('id', {
          address: {
            street: '6th St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94103',
            country: 'USA'
          }
        });
        analytics.called(window._sva.setVisitorTraits, {
          group_id: 'id',
          group_address_street: '6th St',
          group_address_city: 'San Francisco',
          group_address_state: 'CA',
          group_address_postal_code: '94103',
          group_address_country: 'USA'
        });
      });

      it('should drop arrays in traits', function() {
        analytics.group('id', {
          stringifyMe: [{ a: 'b' }, { a: 'c' }]
        });
        analytics.called(window._sva.setVisitorTraits, {
          group_id: 'id'
        });
      });
    });
  });
});
