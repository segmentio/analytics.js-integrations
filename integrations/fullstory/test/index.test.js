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
    analytics.compare(FullStory, integration('FullStory')
        .option('org', '')
        .option('debug', false));
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
        analytics.assert(traits && traits.hasOwnProperty('segmentAnonymousId_str'),
            'did not set anonymous id correctly');
      });

      it('should only send strings as the id', function() {
        analytics.identify(1);
        analytics.called(window.FS.identify, '1');
        analytics.didNotCall(window.FS.setUserVars);
        var traits = window.FS.identify.args[0][0];
        analytics.assert(traits && !traits.hasOwnProperty('segmentAnonymousId_str'),
            'did set anonymous id despite user id');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.FS.identify, 'id');
      });

      it('should camel case custom props', function() {
        analytics.identify('id', { name: 'Abc123', email: 'example@pizza.com', 'first name': 'Steven', 'lastName': 'Brown' });
        analytics.called(window.FS.identify, 'id', { displayName: 'Abc123', email: 'example@pizza.com', firstName: 'Steven', lastName: 'Brown' });
      });

      it('should map name and email', function() {
        analytics.identify('id', { name: 'Test', email: 'test@test.com' });
        analytics.called(window.FS.identify, 'id', { displayName: 'Test', email: 'test@test.com' });
      });

      it('should respect existing type tags', function() {
        // Type tags should pass through.
        var payload = {
          my_real: 17.0,
          my_int_str: 'foo',
          my_str_int: 4,
          my_int_date: new Date(),
          my_int_bool: true
        };
        analytics.identify('id3', payload);
        analytics.called(window.FS.identify, 'id3', payload);
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
