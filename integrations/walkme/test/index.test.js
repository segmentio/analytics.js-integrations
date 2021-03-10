'use strict';

window.localStorage.setItem('wm_segment', true);

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var fmt = require('@segment/fmt');
var Walkme = require('../lib');

describe('WalkMe', function() {
  var analytics;
  var walkme;
  var options = {
    walkMeSystemId: 'E011E9F84AD84D819286A5A94BAF2255',
    walkMeEnvironment: 'test',
    walkMeLoadInIframe: true
  };

  beforeEach(function() {
    analytics = new Analytics();
    walkme = new Walkme(options);
    analytics.use(Walkme);
    analytics.use(tester);
    analytics.add(walkme);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    walkme.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(
      Walkme,
      integration('WalkMe')
        .assumesPageview()
        .option('walkMeSystemId', '')
        .option('walkMeEnvironment', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(walkme, 'load');
    });

    describe('#initialize', function() {
      it('it should set global WalkMe options', function() {
        analytics.assert(!window._walkmeConfig);
        analytics.initialize();
        analytics.page();
        analytics.identify();
        analytics.deepEqual(window._walkmeConfig, { smartLoad: true });
      });
    });
  });

  describe('loading', function() {
    beforeEach(function() {
      analytics.spy(walkme, 'load');
    });

    it('should load walkme test lib', function(done) {
      try {
        analytics.load(walkme, function() {
          analytics.loaded(
            fmt(
              '<script src="https://cdn.walkme.com/users/%s/%s/walkme_%s_https.js"/>',
              options.walkMeSystemId.toLowerCase(),
              'test',
              options.walkMeSystemId.toLowerCase()
            )
          );

          analytics.identify();

          window.walkme_ready = function() {
            analytics.assert(
              !!window.WalkMeAPI,
              'Expected WalkMeAPI to be present on the page'
            );

            done();
          };
        });
      } catch (e) {
        done(e);
      }
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#identify', function() {
      it('Should call WalkMe API when identify happens', function(done) {
        var expected = {
          userId: '112233',
          isAnonUser: false,
          traits: {
            id: '112233'
          }
        };

        analytics.identify(expected.userId);

        window.walkme_ready = function() {
          analytics.equal(expected.isAnonUser, false);
          analytics.equal(
            expected.userId,
            window._walkmeInternals.Segment.userId
          );

          done();
        };
      });

      it('Should call WalkMe API with anonymous user', function(done) {
        var expected = {
          userId: 'user_id_example',
          isAnonUser: true,
          traits: {}
        };

        analytics.user().anonymousId(expected.userId);
        analytics.identify();
        analytics.equal(
          expected.userId,
          window._walkmeInternals.Segment.userId
        );
        analytics.equal(expected.isAnonUser, true);
        analytics.deepEqual(
          expected.traits,
          window._walkmeInternals.Segment.traits
        );

        window.walkme_ready = function() {
          done();
        };
      });
    });
  });
});
