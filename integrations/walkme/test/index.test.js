'use strict';

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
    walkMeSystemId: '1af309271794493f842eeea09740feb0'.toUpperCase(),
    environment: 'test',
    trackWalkMeEvents: false,
    loadWalkMeInIframe: true,
    integrityHash: ''
  };

  beforeEach(function() {
    analytics = new Analytics();
    walkme = new Walkme(options);
    analytics.use(Walkme);
    analytics.use(tester);
    analytics.add(walkme);
    window.analytics = analytics;
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    walkme.reset();
    sandbox();
    window.analytics = undefined;
  });

  it('should have the correct settings', function() {
    analytics.compare(
      Walkme,
      integration('WalkMe')
      .assumesPageview()
      .option('walkMeSystemId', '')
      .option('environment', '')
      .option('trackWalkMeEvents', false)
      .option('loadWalkMeInIframe', false)
      .option('integrityHash', '')
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

        analytics.deepEqual(window._walkmeConfig, {
          smartLoad: true,
          segmentOptions: options
        });
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(walkme.load);
      });
    });
  });

  describe('loading', function() {
    beforeEach(function() {
      analytics.spy(walkme, 'load');
    });

    it.skip('should load walkme test lib', function(done) {
      try {
        var tag = fmt(
          '<script src="https://cdn.walkme.com/users/%s/%s/walkme_%s_https.js" >',
          options.walkMeSystemId.toLowerCase(),
          'test',
          options.walkMeSystemId.toLowerCase()
        );

        window.walkme_ready = function() {
          analytics.assert(
            !!window.WalkMeAPI,
            'Expected WalkMeAPI to be present on the page'
          );

          done();
        };

        analytics.load(walkme, function() {
          analytics.loaded(tag);
          analytics.identify('UserId');
        });
      } catch (e) {
        done(e);
      }
    }).timeout(10000);

    it('should load walkme SRI', function(done) {
      try {
        var walkMeSystemId = '42b2849a0ca54749bd485bcbd5bcc64e';
        var integrityHash = 'sha256-FjbibNOUzdIz+mtyFRU7NHj1G5tPgzOuJNCkRyDmXr8=';

        var tag = fmt(
          '<script src="https://cdn.walkme.com/users/%s/%s/walkme_private_%s_https.js" crossorigin="" integrity="%s" >',
          walkMeSystemId,
          'test',
          walkMeSystemId,
          integrityHash
        );

        window.walkme_ready = function() {
          analytics.assert(
            !!window.WalkMeAPI,
            'Expected WalkMeAPI to be present on the page'
          );

          done();
        };

        walkme.options.walkMeSystemId = '42b2849a0ca54749bd485bcbd5bcc64e';
        walkme.options.integrityHash = 'sha256-FjbibNOUzdIz+mtyFRU7NHj1G5tPgzOuJNCkRyDmXr8=';

        analytics.load(walkme, function() {
          analytics.loaded(tag);
        });
      } catch (e) {
        done(e);
      }
    }).timeout(10000);
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      window.analytics = analytics;
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
      }).timeout(10000);
    });
  });
});
