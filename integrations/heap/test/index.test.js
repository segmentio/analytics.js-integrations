'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var each = require('component-each');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Heap = require('../lib/');

describe('Heap', function() {
  var heap;
  var analytics;
  var options = {
    appId: '1535634150'
  };

  beforeEach(function() {
    analytics = new Analytics();
    heap = new Heap(options);
    analytics.use(Heap);
    analytics.use(tester);
    analytics.add(heap);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    heap.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Heap, integration('Heap')
      .global('heap')
      .option('appId', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(heap, 'load');
    });

    describe('#initialize', function() {
      it('should create window.heap', function() {
        analytics.assert(!window.heap);
        analytics.initialize();
        analytics.assert(window.heap);
      });

      it('should stub window.heap with the right methods', function() {
        var methods = ['addEventProperties', 'addUserProperties', 'clearEventProperties', 'identify', 'removeEventProperty', 'setEventProperties', 'track', 'unsetEventProperty', 'resetIdentity'];
        analytics.assert(!window.heap);
        analytics.initialize();
        each(methods, function(method) {
          analytics.assert(window.heap[method]);
        });
      });

      it('should set window.heap.appid', function() {
        analytics.assert(!window.heap);
        analytics.initialize();
        analytics.assert(window.heap.appid === options.appId);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(heap.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(heap, done);
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
        analytics.stub(window.heap, 'identify');
        analytics.stub(window.heap, 'addUserProperties');
      });

      it('should send traits', function() {
        analytics.identify({ trait: true, number: 1 });
        analytics.called(window.heap.addUserProperties, { trait: true, number: 1 });
      });

      it('should alias email to _email', function() {
        analytics.identify({ trait: true, email: 'email@email.org' });
        analytics.called(window.heap.addUserProperties, { trait: true, _email: 'email@email.org' });
      });

      it('should send id as handle', function() {
        analytics.identify('id');
        analytics.called(window.heap.identify, 'id');
      });

      it('should send id as handle and traits', function() {
        analytics.identify('id', { trait: 'trait' });
        analytics.called(window.heap.identify, 'id');
        analytics.called(window.heap.addUserProperties, { id: 'id', trait: 'trait' });
      });

      it('should flatten nested objects and arrays', function() {
        analytics.identify('id', {
          email: 'teemo@teemo.com',
          property: 3,
          foo: {
            bar: {
              hello: 'teemo'
            },
            cheese: ['1', 2, 'cheers']
          },
          products: [
          { A: 'Jello', B: 1 },
          { B: 'Peanut', C: true }
          ]
        });
        analytics.called(window.heap.identify, 'id');
        analytics.called(window.heap.addUserProperties, {
          id: 'id',
          _email: 'teemo@teemo.com',
          property: 3,
          'foo.bar.hello': 'teemo',
          'foo.cheese': '[\"1\",2,\"cheers\"]',
          products: '[{\"A\":\"Jello\",\"B\":1},{\"B\":\"Peanut\",\"C\":true}]'
        });
      });

      it('should send date traits as ISOStrings', function() {
        var date = new Date('2016');
        analytics.identify('id', { date: date });
        analytics.called(window.heap.identify, 'id');
        analytics.called(window.heap.addUserProperties, { id: 'id', date: '2016-01-01T00:00:00.000Z' });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.heap, 'track');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.heap.track, 'event');
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window.heap.track, 'event', { property: true });
      });

      it('should filter out undefined or null props', function() {
        analytics.track('event', { property: undefined, prop2: null });
        analytics.called(window.heap.track, 'event', {});
      });

      it('should flatten nested objects and arrays', function() {
        analytics.track('event', {
          hello: 'hello',
          property: 3,
          foo: {
            bar: {
              hello: 'teemo'
            },
            cheese: ['1', 2, 'cheers']
          },
          products: [
          { A: 'Jello', B: 'haha' },
          { A: 'Peanut', B: true }
          ],
          topArray: ['1', 2, true]
        });
        analytics.called(window.heap.track, 'event', {
          hello: 'hello',
          property: 3,
          'foo.bar.hello': 'teemo',
          'foo.cheese': '[\"1\",2,\"cheers\"]',
          products: '[{\"A\":\"Jello\",\"B\":\"haha\"},{\"A\":\"Peanut\",\"B\":true}]',
          topArray: '[\"1\",2,true]'
        });
      });
    });
  });
});
