'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var Boomtrain = require('../lib/');

describe('Boomtrain', function() {
  var analytics;
  var boomtrain;
  var options = {
    apiKey: '324fa582528ea3dbc96bd7e94a2d5b61'
  };

  beforeEach(function() {
    analytics = new Analytics();
    boomtrain = new Boomtrain(options);
    analytics.use(Boomtrain);
    analytics.use(tester);
    analytics.add(boomtrain);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    boomtrain.reset();
    // sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Boomtrain, integration('Boomtrain')
      .global('_bt')
      .option('apiKey', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(boomtrain, 'load');
    });

    describe('#initialize', function() {
      it('should create the window._bt object', function() {
        analytics.assert(!window._bt);
        analytics.initialize();
        analytics.assert(window._bt);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(boomtrain.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(boomtrain, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._bt.person, 'set');
      });

      it('should send an id', function() {
        analytics.identify('jacob@boomtrain.com');
        analytics.called(window._bt.person.set, { id: 'jacob@boomtrain.com' , email:'jacob@boomtrain.com' });
      });

      it('should not send only traits', function() {
        analytics.identify({ trait: true });
        analytics.didNotCall(window._bt.person.set);
      });

      it('should send an id, traits, and email (from object)', function() {
        analytics.identify('id', { trait: true, email: 'jaimal@boomtrain.com' });
        analytics.called(window._bt.person.set, { id: 'id', trait: true, email: 'jaimal@boomtrain.com' });
      });

      it('should send a specified email', function() {
        var user_id = 'fake_app_member_id';
        analytics.identify(user_id, { trait: true, email: 'jaimal@boomtrain.com' });
        analytics.called(window._bt.person.set, { trait: true, email: 'jaimal@boomtrain.com', id: user_id });
      });

      it('should not send id as email (if id is an invalid email)', function() {
        var user_id = 'invalid_email';
        analytics.identify(user_id, { trait: true });
        analytics.called(window._bt.person.set, { trait: true, id: user_id, email: undefined });
      });

      it('should convert dates to unix timestamps', function() {
        var date = new Date();
        analytics.identify('id', { date: date });
        analytics.called(window._bt.person.set, {
          id: 'id',
          date: Math.floor(date / 1000),
          email: undefined
        });
      });

      it('should alias created to created_at', function() {
        var date = new Date();
        analytics.identify('id', { createdAt: date });
        analytics.called(window._bt.person.set, {
          id: 'id',
          created_at: Math.floor(date / 1000),
          email: undefined
        });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        var meta = document.createElement('meta');
        meta.setAttribute('property', 'og:type');
        meta.setAttribute('content', 'blog');
        document.getElementsByTagName('head')[0].appendChild(meta);
        analytics.stub(window._bt, 'track');
      });
      // todo: add another test for when the property og:type isn't available
      it('should get page URL and call _bt.track with correct model and ID', function() {
        var referrer = window.document.referrer;
        analytics.page('Home Page', { url: 'https://marketingreads.com/deloitte-digital-buys-creative-agency-heat/', model: 'blog' });
        analytics.called(window._bt.track, 'viewed', { name: 'Home Page', id: '602265785760ac3ae5c2bb6909172b2c', model: 'blog', url: 'https://marketingreads.com/deloitte-digital-buys-creative-agency-heat/', referrer: referrer, search: '', title: '', path: '/context.html' });
      });
      it('should use specified model and ids', function() {
        var url = window.location.href;
        var referrer = window.document.referrer;
        analytics.page({ id:'test_id', model: 'blog' });
        analytics.called(window._bt.track, 'viewed', { id: 'test_id', model: 'blog', url: url, referrer: referrer, search: '', title: '', path: '/context.html' });
      });
    });
    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._bt, 'track');
      });

      it('should send an event and properties', function() {
        analytics.track('viewed', { id: '602265785760ac3ae5c2bb6909172b2c', model: 'article' });
        analytics.called(window._bt.track, 'viewed', { id: '602265785760ac3ae5c2bb6909172b2c', model: 'article' });
      });
    });
  });
});
