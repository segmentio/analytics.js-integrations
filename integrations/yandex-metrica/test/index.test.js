'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var tick = require('next-tick');
var Yandex = require('../lib/');

describe('Yandex', function() {
  var analytics;
  var yandex;
  var options = {
    counterId: 22522351
  };

  beforeEach(function() {
    analytics = new Analytics();
    yandex = new Yandex(options);
    analytics.use(Yandex);
    analytics.use(tester);
    analytics.add(yandex);
    window['yaCounter' + options.counterId] = undefined;
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    yandex.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Yandex, integration('Yandex Metrica')
      .assumesPageview()
      .global('yandex_metrika_callbacks')
      .global('Ya')
      .option('counterId', null)
      .option('clickmap', false)
      .option('webvisor', false));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(yandex, 'load');
    });

    describe('#initialize', function() {
      it('should push onto the yandex_metrica_callbacks', function() {
        analytics.assert(!window.yandex_metrika_callbacks);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.yandex_metrika_callbacks.length === 1);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(yandex.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(yandex, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    it('should create a yaCounter object', function() {
      tick(function() {
        var key = 'yaCounter' + yandex.options.counterId;
        analytics.assert(window[key]);
      });
    });
  });
});
