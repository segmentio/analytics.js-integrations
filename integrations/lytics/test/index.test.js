'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Lytics = require('../lib/');

describe('Lytics', function() {
  var analytics;
  var lytics;
  var options = {
    cid: '1477',
    cookie: 'lytics_cookie'
  };

  beforeEach(function() {
    document.cookie += 'seerid=12345.12345';

    analytics = new Analytics();
    lytics = new Lytics(options);
    analytics.use(Lytics);
    analytics.use(tester);
    analytics.add(lytics);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    lytics.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Lytics, integration('Lytics')
      .global('jstag')
      .option('cid', '')
      .option('cookie', 'seerid')
      .option('delay', 2000)
      .option('sessionTimeout', 1800)
      .option('url', '//c.lytics.io'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(lytics, 'load');
    });

    describe('#initialize', function() {
      it('should create window.jstag', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(window.jstag);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(lytics.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(lytics, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    it('should inject a tag with the correct cid', function() {
      var tag = lytics.templates.library;

      analytics.equal(tag.type, 'script');
      analytics.equal(tag.attrs.src, 'https://c.lytics.io/api/tag/{{ cid }}/lio.js');
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.jstag, 'send');
      });

      it('should call send', function() {
        analytics.page('Page Name', { property: true });
        analytics.called(window.jstag.send, 'default', {
          _e: 'Page Name',
          property: true,
          path: window.location.pathname,
          referrer: document.referrer,
          title: document.title,
          search: window.location.search,
          url: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.jstag, 'send');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window.jstag.send, 'default', { user_id: 'id' });
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window.jstag.send, 'default', { trait: true });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.jstag.send, 'default', { user_id: 'id', trait: true });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.jstag, 'send');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.jstag.send, 'default', { _e: 'event' });
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.jstag.send, 'default', { _e: 'event', property: true });
      });
    });
  });
});
