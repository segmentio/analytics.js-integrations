'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var MoEngage = require('../lib/');

describe('MoEngage', function() {
  var analytics;
  var moengage;
  var options = {
    apiKey: 'AJ1WTFKFAMAG8045ZXSQ9GMK',
    debugMode: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    moengage = new MoEngage(options);
    analytics.use(integrationTester);
    analytics.use(MoEngage);
    analytics.add(moengage);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    sandbox();
  });

  it('should have the correct options', function() {
    analytics.compare(
      MoEngage,
      integration('MoEngage')
        .option('apiKey', '')
        .option('debugMode', false)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(moengage, 'load');
    });

    describe('#initialize', function() {
      it('should call load', function() {
        analytics.initialize();
        analytics.called(moengage.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(moengage, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(moengage._client, 'add_first_name');
        analytics.stub(moengage._client, 'add_last_name');
        analytics.stub(moengage._client, 'add_email');
        analytics.stub(moengage._client, 'add_mobile');
        analytics.stub(moengage._client, 'add_user_name');
        analytics.stub(moengage._client, 'add_gender');
        analytics.stub(moengage._client, 'add_birthday');
        analytics.stub(moengage._client, 'add_user_attribute');
        analytics.stub(moengage._client, 'add_unique_user_id');
        analytics.stub(moengage._client, 'destroy_session');
      });

      it('should send identify', function() {
        var traits = {
          firstName: 'han',
          lastName: 'solo',
          email: 'han@segment.com',
          phone: '4012229047',
          name: 'han solo',
          gender: 'male',
          birthday: '08/13/1991',
          customTrait: true
        };
        analytics.identify('han123', traits);
        analytics.called(moengage._client.add_unique_user_id, 'han123');
        analytics.called(moengage._client.add_first_name, traits.firstName);
        analytics.called(moengage._client.add_last_name, traits.lastName);
        analytics.called(moengage._client.add_email, traits.email);
        analytics.called(moengage._client.add_mobile, traits.phone);
        analytics.called(moengage._client.add_user_name, traits.name);
        analytics.called(moengage._client.add_gender, traits.gender);
        analytics.called(moengage._client.add_birthday, traits.birthday);
        analytics.called(
          moengage._client.add_user_attribute,
          'customTrait',
          traits.customTrait
        );
      });

      it('should fall back to traits.username', function() {
        var traits = { username: 'prince oberyn' };
        analytics.identify('han123', traits);
        analytics.called(moengage._client.add_user_name, traits.username);
      });

      it('it should handle traits.username', function() {
        var traits = {
          name:
            'Daenerys Stormborn of the House Targaryen, First of Her Name, the Unburnt, Queen of the Andals and the First Men, Khaleesi of the Great Grass Sea, Breaker of Chains, and Mother of Dragons',
          username: 'khaleesi'
        };
        analytics.identify('targaryen2', traits);
        analytics.called(moengage._client.add_user_name, traits.name);
        analytics.called(
          moengage._client.add_user_attribute,
          'username',
          traits.username
        );
      });

      it('should reject undefined values before calling partner methods', function() {
        analytics.identify('jon snow');
        analytics.didNotCall(moengage._client.add_user_name);
        analytics.didNotCall(moengage._client.add_user_attribute);
      });

      it('should destroy session if identify is called for a new user', function() {
        analytics.identify('drogon');
        var drogonAnonId = analytics.user().anonymousId();
        if (moengage.initializedAnonymousId !== drogonAnonId) {
          throw new Error(
            'MoEngange anonymous ID should be equal after an identify call ' +
              moengage.initializedAnonymousId +
              ' vs ' +
              drogonAnonId +
              ''
          );
        }
        analytics.called(moengage._client.add_unique_user_id, 'drogon');
        analytics.identify('night king');
        var nightKingAnonId = analytics.user().anonymousId();
        if (nightKingAnonId === drogonAnonId) {
          throw new Error(
            'The anonymous ID should be different after an identify call'
          );
        }
        analytics.called(moengage._client.add_unique_user_id, 'night king');
      });

      it('should not call destroy session if identify is called for a existing user', function() {
        analytics.identify('drogon');
        analytics.called(moengage._client.add_unique_user_id, 'drogon');
        analytics.identify('drogon');
        analytics.didNotCall(moengage._client.destroy_session);
        analytics.called(moengage._client.add_unique_user_id, 'drogon');
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(moengage._client, 'track_event');
        analytics.stub(moengage._client, 'destroy_session');
      });

      it('should send track', function() {
        var properties = {
          ice: 'fire',
          nested: ['ha', 'haha', { hahaha: 'hahahahaha' }],
          andThis: { gucci: [], mane: true }
        };
        analytics.track('The Song', properties);
        analytics.called(moengage._client.track_event, 'The Song', properties);
      });

      it('should destroy session if track is called after a logout', function() {
        var properties = {
          ice: 'fire',
          nested: ['ha', 'haha', { hahaha: 'hahahahaha' }],
          andThis: { gucci: [], mane: true }
        };

        analytics.identify('drogon');
        analytics.track('The Song', properties);
        analytics.didNotCall(moengage._client.destroy_session);
        // Logout
        analytics.reset();
        analytics.track('The Song', properties);
      });

      it('should not call destroy session if track is called for a existing user', function() {
        var properties = {
          ice: 'fire',
          nested: ['ha', 'haha', { hahaha: 'hahahahaha' }],
          andThis: { gucci: [], mane: true }
        };
        analytics.track('The Song', properties);
        analytics.didNotCall(moengage._client.destroy_session);
        analytics.called(moengage._client.track_event, 'The Song', properties);
        analytics.track('The Song', properties);
        analytics.didNotCall(moengage._client.destroy_session);
        analytics.called(moengage._client.track_event, 'The Song', properties);
      });
    });

    describe('#alias', function() {
      beforeEach(function() {
        analytics.stub(moengage._client, 'update_unique_user_id');
      });
      it('should called update_unique_user_id on calling alias', function() {
        analytics.alias(123);
        analytics.called(moengage._client.update_unique_user_id);
      });
      it('should not called update_unique_user_id on calling alias without new ID', function() {
        analytics.alias();
        analytics.didNotCall(moengage._client.update_unique_user_id);
      });
      it('should called update_unique_user_id on calling alias with ID', function() {
        analytics.alias(123);
        analytics.called(moengage._client.update_unique_user_id, 123);
      });
      it('should not called update_unique_user_id on calling alias with wrong ID', function() {
        analytics.alias(123);
        analytics.didNotCall(moengage._client.update_unique_user_id, 1234);
      });
    });

  });
});
