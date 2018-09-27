'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var FullStory = require('../lib/');

describe('FullStory', function() {
  var analytics;
  var fullstory;
  var options = {
    org: '1JO',
    debug: false,
    passEvents: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    fullstory = new FullStory(options);
    analytics.use(FullStory);
    analytics.use(tester);
    analytics.add(fullstory);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    fullstory.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      FullStory,
      integration('FullStory')
        .option('org', '')
        .option('debug', false)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(fullstory, 'load');
    });

    describe('#initialize', function() {
      it('should create window.FS and window.FS.clearUserCookie', function() {
        analytics.assert(!window.FS);
        analytics.initialize();
        analytics.assert(window.FS);
        analytics.assert(window.FS.clearUserCookie);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(fullstory.load);
      });
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.FS, 'identify');
        analytics.stub(window.FS, 'setUserVars');
      });

      it('should default to anonymousId', function() {
        analytics.identify();
        analytics.didNotCall(window.FS.identify);
        analytics.called(window.FS.setUserVars);
        var traits = window.FS.setUserVars.args[0][0];
        analytics.assert(
          traits && traits.hasOwnProperty('segmentAnonymousId_str'),
          'did not set anonymous id correctly'
        );
      });

      it('should only send strings as the id', function() {
        analytics.identify(1);
        analytics.called(window.FS.identify, '1');
        analytics.didNotCall(window.FS.setUserVars);
        var traits = window.FS.identify.args[0][0];
        analytics.assert(
          traits && !traits.hasOwnProperty('segmentAnonymousId_str'),
          'did set anonymous id despite user id'
        );
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.FS.identify, 'id');
      });

      it('should camel case custom props', function() {
        analytics.identify('id', {
          name: 'Abc123',
          email: 'example@pizza.com',
          'First Name': 'Steven'
        });
        analytics.called(window.FS.identify, 'id', {
          displayName: 'Abc123',
          email: 'example@pizza.com',
          firstName_str: 'Steven'
        });
      });

      it('should map name and email', function() {
        analytics.identify('id', { name: 'Test', email: 'test@test.com' });
        analytics.called(window.FS.identify, 'id', {
          displayName: 'Test',
          email: 'test@test.com'
        });
      });

      it('should map integers properly', function() {
        // JavaScript only has Number, so 3.0 === 3 and is an "int"
        analytics.identify('id', { name: 'Test', revenue: 7, number: 3.0 });
        analytics.called(window.FS.identify, 'id', {
          displayName: 'Test',
          revenue_int: 7,
          number_int: 3
        });
      });

      it('should map floats properly', function() {
        analytics.identify('id1', {
          name: 'Example',
          amtAbandonedInCart: 3.84
        });
        analytics.called(window.FS.identify, 'id1', {
          displayName: 'Example',
          amtAbandonedInCart_real: 3.84
        });
      });

      it('should map dates properly', function() {
        analytics.identify('id2', {
          name: 'Test123',
          signupDate: new Date('2014-03-11T13:19:23Z')
        });
        analytics.called(window.FS.identify, 'id2', {
          displayName: 'Test123',
          signupDate_date: new Date('2014-03-11T13:19:23Z')
        });
      });

      it('should map booleans properly', function() {
        analytics.identify('id3', { name: 'Steven', registered: true });
        analytics.called(window.FS.identify, 'id3', {
          displayName: 'Steven',
          registered_bool: true
        });
      });

      it('should skip arrays entirely', function() {
        analytics.identify('id3', { ok: 'string', teams: ['eng', 'redsox'] });
        analytics.called(window.FS.identify, 'id3', { ok_str: 'string' });
      });

      it('should skip user objects entirely', function() {
        analytics.identify('id3', {
          ok: 7,
          account: { level: 'premier', avg_annual: 30000 }
        });
        analytics.called(window.FS.identify, 'id3', { ok_int: 7 });
      });

      it('should respect existing type tags', function() {
        analytics.identify('id3', {
          my_real: 17,
          my_int_str: 17,
          my_str_int: 'foo',
          my_int_date: 3,
          my_int_bool: 4,
          mystr_real: 'plugh'
        });
        analytics.called(window.FS.identify, 'id3', {
          my_real: 17, // didn't become my_real_real (double tag)
          myInt_str: 17, // all other tests check type mismatch isn't
          myStr_int: 'foo', // "fixed" to e.g. myInt_str_int, but keeps
          myInt_date: 3, // the user's tag (and their mismatch error)
          myInt_bool: 4,
          mystr_real: 'plugh'
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.FS, 'event');
      });

      it('should not send events when passEvents option is false', function() {
        analytics.track('foo', { some_field: 'field_value' });
        analytics.didNotCall(window.FS.event);
      });

      it('should send track event name and properties when passEvents option is true', function() {
        fullstory.options.passEvents = true;
        analytics.track('foo', { some_field: 'field_value' });
        analytics.called(window.FS.event, 'foo', { some_field: 'field_value' });
      });
    });
  });
});
