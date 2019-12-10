'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var Parsely = require('../lib/');
var each = require('@ndhoule/each');
var filter = require('array-filter');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var json = require('json3');

describe('Parsely', function() {
  var analytics;
  var parsely;
  var options = {
    apiKey: 'example.com',
    dynamicTracking: false,
    inPixelMetadata: false,
    trackEvents: false,
    customMapping: {}
  };

  beforeEach(function() {
    analytics = new Analytics();
    parsely = new Parsely(options);
    analytics.use(Parsely);
    analytics.use(tester);
    analytics.add(parsely);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    parsely.reset();
    each(function(element) {
      document.head.removeChild(element);
    }, filter(document.head.getElementsByTagName('meta'), isParselyMetaTag));
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Parsely, integration('Parsely')
      .global('PARSELY')
      .option('apiKey', '')
      .option('dynamicTracking', false)
      .option('inPixelMetadata', false)
      .option('trackEvents', false));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(parsely, 'load');
    });

    it('should create a Parsely meta tag', function() {
      var isLoaded = function() {
        return !!filter(document.getElementsByTagName('meta'), isParselyMetaTag).length;
      };

      analytics.assert(!isLoaded());
      parsely.initialize();
      analytics.assert(isLoaded());
    });

    it('should set window.PARSELY if not already set', function() {
      analytics.assert(window.PARSELY === undefined);
      analytics.initialize();
      analytics.assert(window.PARSELY);
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      window.PARSELY = {};
      analytics.load(parsely, done);
    });
  });

  describe('initialization', function() {
    it('should load p.js', function(done) {
      analytics.assert(!isLoaded());
      analytics.once('ready', function() {
        analytics.assert(isLoaded());
        done();
      });
      analytics.initialize();
    });

    it('should set autotrack to false if dynamic tracking is enabled', function(done) {
      parsely.options.dynamicTracking = true;
      analytics.initialize();
      analytics.assert(window.PARSELY.autotrack === false);
      done();
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('page', function() {
      beforeEach(function() {
        analytics.stub(window.PARSELY, 'beacon');
        analytics.stub(window.PARSELY.beacon, 'trackPageView');
      });

      it('should do nothing if dynamic tracking is not enabled', function() {
        analytics.page();
        analytics.didNotCall(window.PARSELY.beacon.trackPageView);
      });

      it('should call page if dynamic tracking is enabled', function() {
        parsely.options.dynamicTracking = true;
        analytics.page();
        analytics.called(window.PARSELY.beacon.trackPageView);
      });

      it('should not pass metadata when not enabled', function() {
        parsely.options.dynamicTracking = true;
        analytics.page({
          author: 'Chris Sperandio'
        });
        var args = window.PARSELY.beacon.trackPageView.args;
        analytics.assert(!args[0][0].metadata);
      });

      it('should pass metadata json stringified when enabled', function() {
        parsely.options.dynamicTracking = true;
        parsely.options.inPixelMetadata = true;
        parsely.options.customMapping = { author: 'authors' };
        analytics.page({
          title: 'sup?',
          author: 'Chris Sperandio'
        });
        var args = window.PARSELY.beacon.trackPageView.args;
        analytics.deepEqual(json.parse(args[0][0].metadata), {
          authors: ['Chris Sperandio'],
          link: 'http://localhost:9876/context.html',
          page_type: 'post',
          title: 'sup?'
        });
      });

      it('should let you override default metadata with custom mapping', function() {
        parsely.options.dynamicTracking = true;
        parsely.options.inPixelMetadata = true;
        parsely.options.customMapping = {
          kanye: 'section',
          drake: 'image_url',
          weezy: 'pub_date_tmsp',
          breezy: 'title',
          jeezy: 'tags',
          kdot: 'authors',
          weeknd: 'link',
          ptype: 'page_type'
        };
        analytics.page({
          kanye: 'father stretch my hands pt.1',
          drake: 'started from the bottom',
          weezy: 'running back',
          breezy: 'loyal',
          jeezy: 'put on',
          kdot: 'm.A.A.d city',
          weeknd: 'Reminder',
          ptype: 'index'
        });
        var args = window.PARSELY.beacon.trackPageView.args;
        analytics.deepEqual(json.parse(args[0][0].metadata), {
          section: 'father stretch my hands pt.1',
          image_url: 'started from the bottom',
          pub_date_tmsp: 'running back',
          title: 'loyal',
          tags: ['put on'],
          authors: ['m.A.A.d city'],
          link: 'Reminder',
          page_type: 'index'
        });
      });
    });

    describe('track', function() {
      beforeEach(function() {
        analytics.stub(window.PARSELY, 'beacon');
        analytics.stub(window.PARSELY, 'video');
        analytics.stub(window.PARSELY.beacon, 'trackPageView');
      });

      it('should do nothing if events are not enabled', function() {
        analytics.track('test');
        analytics.didNotCall(window.PARSELY.beacon.trackPageView);
      });

      it('should send events if enabled', function() {
        parsely.options.trackEvents = true;
        analytics.track('test');
        analytics.called(window.PARSELY.beacon.trackPageView);
      });

      it('should send event name as `action`', function() {
        parsely.options.trackEvents = true;
        analytics.track('test');
        var args = window.PARSELY.beacon.trackPageView.args;
        analytics.assert(args[0][0].action === 'test');
      });

      it('should send event properties as `data`', function() {
        parsely.options.trackEvents = true;
        analytics.track('test', { testing: 'test' });
        var args = window.PARSELY.beacon.trackPageView.args;
        analytics.deepEqual(args[0][0].data, { testing: 'test' });
      });

      describe('video support', function() {
        var assetId = '12345';

        beforeEach(function() {
          analytics.stub(window.PARSELY.video, 'trackPlay');
          analytics.stub(window.PARSELY.video, 'trackPause');
          analytics.stub(window.PARSELY.video, 'reset');
        });

        it('should track content view starts', function() {
          analytics.track('Video Content Started', {
            assetId: assetId,
            airdate: 'Mon May 08 2017 11:00:34 GMT-0700 (PDT)',
            genre: 'Sports',
            publisher: 'Chris Nixon',
            keywords: ['hockey', 'henrik lundquist', 'rangers']
          }, {
            integrations: {
              Parsely: {
                imageUrl: 'http://logo.com'
              }
            }
          });
          var args = window.PARSELY.video.trackPlay.args;
          analytics.equal(args[0][0], assetId);
          analytics.deepEqual(args[0][1], { pub_date_tmsp: 1494266434000, image_url: 'http://logo.com', section: 'Sports', authors: ['Chris Nixon'], tags: ['hockey', 'henrik lundquist', 'rangers'] });
        });

        it('should track playback paused events', function() {
          analytics.track('Video Playback Paused', {
            assetId: assetId,
            airdate: 'Mon May 08 2017 11:00:34 GMT-0700 (PDT)',
            genre: 'Sports',
            publisher: 'Chris Nixon'
          }, {
            integrations: {
              Parsely: {
                imageUrl: 'http://logo.com',
                tags: ['hockey', 'henrik lundquist', 'rangers']
              }
            }
          });
          var args = window.PARSELY.video.trackPause.args;
          analytics.equal(args[0][0], assetId);
          analytics.deepEqual(args[0][1], { pub_date_tmsp: 1494266434000, image_url: 'http://logo.com', section: 'Sports', authors: ['Chris Nixon'], tags: ['hockey', 'henrik lundquist', 'rangers'] });
        });

        it('should fallback on CURRENT_VIDEO_METADATA global', function() {
          analytics.track('Video Content Started', {
            assetId: assetId,
            airdate: 'Mon May 08 2017 11:00:34 GMT-0700 (PDT)',
            genre: 'Sports',
            publisher: 'Chris Nixon',
            keywords: ['hockey', 'henrik lundquist', 'rangers']
          }, {
            integrations: {
              Parsely: {
                imageUrl: 'http://logo.com'
              }
            }
          });
          analytics.track('Video Playback Paused');
          var args = window.PARSELY.video.trackPause.args;
          analytics.deepEqual(args[0][1], { pub_date_tmsp: 1494266434000, image_url: 'http://logo.com', section: 'Sports', authors: ['Chris Nixon'], tags: ['hockey', 'henrik lundquist', 'rangers'] });
        });

        it('should track playback interrupted events', function() {
          analytics.track('Video Playback Interrupted', { assetId: assetId });
          var args = window.PARSELY.video.reset.args;
          analytics.equal(args[0][0], assetId);
        });

        // TODO: is this desired behavior?
        it('should also send video events as custom events', function() {
          parsely.options.trackEvents = true;
          analytics.track('Video Playback Interrupted', { assetId: assetId });
          analytics.called(window.PARSELY.beacon.trackPageView);
        });
      });
    });
  });
});

function isParselyMetaTag(element) {
  return !!(element && element.getAttribute('data-parsely-site'));
}

function isPjsScript(element) {
  return !!element && (/p.js$/).test(element.src);
}

function isLoaded() {
  return !!filter(document.getElementsByTagName('script'), isPjsScript).length;
}
