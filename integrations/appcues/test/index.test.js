'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Appcues = require('../lib/').Integration;

describe('Appcues', function() {
  var appcues;
  var analytics;
  var options = {
    appcuesId: '1663',
    domain: '//fast.appcues.net/'
  };

  // Disable AMD for these browser tests.
  var _define = window.define;

  beforeEach(function() {
    analytics = new Analytics();
    appcues = new Appcues(options);
    analytics.use(Appcues);
    analytics.use(tester);
    analytics.add(appcues);
    window.define = undefined;
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    sandbox();
    window.define = _define;
  });

  after(function() {
    appcues.reset();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Appcues,
      integration('Appcues')
        .global('Appcues')
        .option('appcuesId', '')
        .option('domain', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(appcues, 'load');
    });

    afterEach(function() {
      appcues.reset();
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.called(appcues.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(appcues, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.Appcues, 'page');
      });

      it('should call Appcues.page', function() {
        analytics.page('some page', { someAttr: true });
        analytics.called(window.Appcues.page, 'some page');
        // No way to assert an argument "match", and analytics.page includes
        // other properties automatically, so manually checking the second
        // arg to Appcues.page includes the `someAttr` value.
        analytics.assert(window.Appcues.page.args[0][1].someAttr === true);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.Appcues, 'track');
      });

      it('should send name and attributes', function() {
        analytics.track('some event', { someAttr: true });
        analytics.called(window.Appcues.track, 'some event', {
          someAttr: true
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.Appcues, 'identify');
      });

      it('should send and id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window.Appcues.identify, 'id', {
          id: 'id',
          trait: true
        });
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window.Appcues, 'group');
      });

      it('should send an id and group name', function() {
        analytics.group('id', { groupName: 'group-1' });
        analytics.called(window.Appcues.group, 'id', {
          groupName: 'group-1',
          id: 'id'
        });
      });
    });
  });
});
