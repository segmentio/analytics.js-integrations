'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var Taplytics = require('../lib/');
var integration = require('@segment/analytics.js-integration');
var is = require('is');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');

describe('Taplytics', function() {
  var analytics;
  var taplytics;
  var options = {
    apiKey: '82c35fe2ac8d43e09509e06a628cd6fc',
    options: {
      log_level: -1
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    taplytics = new Taplytics(options);
    analytics.use(Taplytics);
    analytics.use(tester);
    analytics.add(taplytics);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    taplytics.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Taplytics, integration('Taplytics')
      .global('_tlq')
      .global('Taplytics')
      .option('apiKey', '')
      .option('options', {})
      .tag('<script id="taplytics" src="https://cdn.taplytics.com/taplytics.min.js">')
      .assumesPageview());
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(taplytics, 'load');
      analytics.initialize();
    });

    describe('#initialize', function() {
      it('should create window._tlq', function() {
        analytics.assert(is.array(window._tlq));
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(taplytics, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    it('should set window.Taplytics', function() {
      analytics.assert(window.Taplytics);
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._tlq, 'push');
      });

      it('should track events with no properties', function() {
        analytics.track('NAME');

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['track', 'NAME', 0, {}]);
      });

      it('should track events with properties', function() {
        analytics.track('NAME', {
          test: 1
        });

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['track', 'NAME', 0, {
          test: 1
        }]);
      });

      it('should track events with revenue', function() {
        analytics.track('NAME', {
          revenue: 10
        });

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['track', 'NAME', 10, {
          revenue: 10
        }]);
      });

      it('should track events with revenue and properties', function() {
        analytics.track('NAME', {
          revenue: 20,
          test: 1
        });

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['track', 'NAME', 20, {
          revenue: 20,
          test: 1
        }]);
      });

      it('should track events with a total', function() {
        analytics.track('NAME', {
          total: 12
        });

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['track', 'NAME', 12, {
          total: 12
        }]);
      });

      it('should track events with a total and properties', function() {
        analytics.track('NAME', {
          total: 22,
          test: 1
        });

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['track', 'NAME', 22, {
          total: 22,
          test: 1
        }]);
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._tlq, 'push');
      });

      it('should track normal page views', function() {
        analytics.page();

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['page', undefined, undefined, {
          path: location.pathname,
          referrer: document.referrer,
          search: location.search,
          title: document.title,
          url: location.href
        }]);
      });

      it('should track named page views', function() {
        analytics.page('NAME');

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['page', undefined, 'NAME', {
          name: 'NAME',
          path: location.pathname,
          referrer: document.referrer,
          search: location.search,
          title: document.title,
          url: location.href
        }]);
      });

      it('should track catagorized and named page views', function() {
        analytics.page('CATEGORY', 'NAME');

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['page', 'CATEGORY', 'CATEGORY NAME', {
          name: 'NAME',
          category: 'CATEGORY',
          path: location.pathname,
          referrer: document.referrer,
          search: location.search,
          title: document.title,
          url: location.href
        }]);
      });

      it('should track catagorized, named pages with properties', function() {
        analytics.page('CATEGORY', 'NAME', {
          test: 1
        });

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['page', 'CATEGORY', 'CATEGORY NAME', {
          test: 1,
          name: 'NAME',
          category: 'CATEGORY',
          path: location.pathname,
          referrer: document.referrer,
          search: location.search,
          title: document.title,
          url: location.href
        }]);
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._tlq, 'push');
      });

      it('should not send bad input', function() {
        analytics.identify({});

        analytics.didNotCall(window._tlq.push);
      });

      it('should send userId', function() {
        analytics.identify('id');

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['identify', {
          id: 'id'
        }]);
      });

      it('should send traits', function() {
        analytics.identify({
          test: 1
        });

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['identify', {
          test: 1
        }]);
      });

      it('should merge traits and userId', function() {
        analytics.identify('id', {
          test: 1
        });

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['identify', {
          id: 'id',
          test: 1
        }]);
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.user().identify('id');
        analytics.stub(window._tlq, 'push');
      });

      it('should send an id', function() {
        analytics.group('group_id');

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['identify', {
          id: 'id',
          groupId: 'group_id',
          groupTraits: {
            id: 'group_id'
          }
        }]);
      });

      it('should send traits', function() {
        analytics.group({
          test: 1
        });

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['identify', {
          id: 'id',
          groupTraits: {
            test: 1
          }
        }]);
      });

      it('should send an id and traits', function() {
        analytics.group('group_id', {
          test: 2
        });

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['identify', {
          id: 'id',
          groupId: 'group_id',
          groupTraits: {
            id: 'group_id',
            test: 2
          }
        }]);
      });
    });

    describe('#reset', function() {
      beforeEach(function() {
        analytics.stub(window._tlq, 'push');
      });

      it('should reset user', function() {
        taplytics.reset();

        analytics.calledOnce(window._tlq.push);
        analytics.called(window._tlq.push, ['reset']);
      });
    });
  });
});
