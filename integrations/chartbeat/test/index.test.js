'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var extend = require('@ndhoule/extend');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Chartbeat = require('../lib/');

describe('Chartbeat', function() {
  var analytics;
  var chartbeat;
  var options = {
    uid: 'x',
    domain: 'example.com',
    video: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    chartbeat = new Chartbeat(options);
    analytics.use(Chartbeat);
    analytics.use(tester);
    analytics.add(chartbeat);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    chartbeat.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Chartbeat, integration('Chartbeat')
      .global('_sf_async_config')
      .global('_sf_endpt')
      .global('pSUPERFLY')
      .option('domain', '')
      .option('uid', null));
  });

  describe('before loading', function() {
    afterEach(function() {
      chartbeat.reset();
    });

    describe('initialize', function() {
      it('should set pageCalledYet to false and ready to true', function() {
        analytics.initialize();
        analytics.assert(!chartbeat.pageCalledYet);
        analytics.assert(chartbeat._ready);
      });
    });

    describe('first page', function() {
      beforeEach(function() {
        analytics.initialize();
      });

      it('should create window._sf_async_config', function() {
        var expected = extend({}, {
          uid: options.uid,
          domain: options.domain
        }, {
          useCanonical: true
        });

        analytics.page();
        analytics.deepEqual(window._sf_async_config, expected);
      });

      it('should inherit global window._sf_async_config defaults', function() {
        window._sf_async_config = { setting: true };
        var expected = extend({}, { uid: options.uid, domain: options.domain }, {
          setting: true,
          useCanonical: true
        });

        analytics.page();
        analytics.deepEqual(window._sf_async_config, expected);
      });

      it('should create window._sf_endpt', function() {
        analytics.assert(!window._sf_endpt);
        analytics.page();
        analytics.equal('number', typeof window._sf_endpt);
      });

      it('should call #load', function() {
        analytics.stub(chartbeat, 'load');
        analytics.page();
        analytics.called(chartbeat.load);
      });

      it('should set custom globals', function() {
        chartbeat.options.subscriberEngagementKeys = ['test segment key'];

        analytics.page({ path: '/path', title: 'test title', 'test segment key': 'test value' });
        analytics.deepEqual([['test segment key', 'test value']], window._cbq);
        analytics.equal('test title', window._sf_async_config.title);
      });

      it('should set _ready from true to false to true', function(done) {
        analytics.once('ready', function() {
          analytics.assert(chartbeat._ready);
          done();
        });
        analytics.assert(chartbeat._ready);
        analytics.page();
        analytics.assert(!chartbeat._ready);
      });

      it('should not call chartbeat page since chartbeat will page for us when it loads', function(done) {
        analytics.once('ready', function() {
          analytics.stub(window.pSUPERFLY, 'virtualPage');
          analytics.didNotCall(window.pSUPERFLY.virtualPage);
          done();
        });
        analytics.page();
      });
    });
  });

  describe('loading', function() {
    it('should load regular lib when video is false', function() {
      analytics.spy(chartbeat, 'load');
      analytics.initialize();
      analytics.page();
      analytics.loaded('<script src="http://static.chartbeat.com/js/chartbeat.js">');
    });

    it('should load video lib when selected', function() {
      chartbeat.options.video = true;
      analytics.spy(chartbeat, 'load');
      analytics.initialize();
      analytics.page();
      analytics.loaded('<script src="http://static.chartbeat.com/js/chartbeat_video.js">');
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', function() {
        analytics.stub(window.pSUPERFLY, 'virtualPage');
        analytics.stub(window._cbq, 'push');
        done();
      });
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      it('should send a path', function() {
        analytics.page({ path: '/path' });
        analytics.calledOnce(window.pSUPERFLY.virtualPage, '/path');
      });

      it('should set the title', function() {
        analytics.page({ path: '/path', title: 'title' });
        analytics.equal('title', window._sf_async_config.title);
        analytics.calledOnce(window.pSUPERFLY.virtualPage, '/path');
      });

      it('should prefer a title for the name', function() {
        analytics.page('Name', { path: '/path', title: 'title' });
        analytics.equal('title', window._sf_async_config.title);
        analytics.calledOnce(window.pSUPERFLY.virtualPage, '/path');
      });

      it('should prefer a title for the name and category', function() {
        analytics.page('Category', 'Name', { path: '/path', title: 'title' });
        analytics.equal('title', window._sf_async_config.title);
        analytics.calledOnce(window.pSUPERFLY.virtualPage, '/path');
      });

      it('should prefer a name and category for the title if sendNameAndCategoryAsTitle is true', function() {
        chartbeat.options.sendNameAndCategoryAsTitle = true;
        analytics.page('Category', 'Name', { path: '/path', title: 'title' });
        analytics.equal('Category Name', window._sf_async_config.title);
        analytics.calledOnce(window.pSUPERFLY.virtualPage, '/path');
      });

      it('should set the sections and title on the config', function() {
        analytics.page('Category', 'Name', { path: '/path', title: 'title', author: 'Apple Potamus' });
        analytics.equal('Category', window._sf_async_config.sections);
        analytics.equal('Apple Potamus', window._sf_async_config.authors);
        analytics.calledOnce(window.pSUPERFLY.virtualPage, '/path');
      });

      it('should send subscriber engagement information if included and set', function() {
        chartbeat.options.subscriberEngagementKeys = ['test segment key'];
        analytics.page({ path: '/path', 'test segment key': 'test value' });
        analytics.called(window._cbq.push, ['test segment key', 'test value']);
        analytics.calledOnce(window.pSUPERFLY.virtualPage, '/path');
      });
    });
  });
});
