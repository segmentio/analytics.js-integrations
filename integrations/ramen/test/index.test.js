'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Ramen = require('../lib/');

describe('Ramen', function() {
  var analytics;
  var ramen;
  var options = {
    organization_id: '6389149'
  };

  beforeEach(function() {
    analytics = new Analytics();
    ramen = new Ramen(options);
    analytics.use(Ramen);
    analytics.use(tester);
    analytics.add(ramen);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    ramen.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Ramen, integration('Ramen')
      .global('Ramen')
      .global('_ramen')
      .option('organization_id', '')
      .tag('<script src="//cdn.ramen.is/assets/ramen.js">'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(ramen, 'load');
    });

    describe('#initialize', function() {
      it('should not create window.Ramen', function() {
        analytics.assert(!window.Ramen);
        analytics.initialize();
        analytics.page();
        analytics.assert(!window.Ramen);
      });

      it('should create window._ramen', function() {
        analytics.assert(!window._ramen);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._ramen);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(ramen.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(ramen, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    it('should have created Ramen', function() {
      analytics.assert(window.Ramen.config.settings.organization_id === '6389149');
      analytics.assert(window._ramen.is_booted);
    });

    describe('after calling #identify', function() {
      beforeEach(function() {
        analytics.identify('this-user');
      });

      describe('#page', function() {
        beforeEach(function() {
          analytics.stub(window._ramen, 'page');
          analytics.stub(window._ramen, 'identify');
        });

        it('should call _ramen.page & _ramen.identify', function() {
          analytics.page();
          analytics.didNotCall(window._ramen.identify);
          analytics.called(window._ramen.page);
        });
      });

      describe('#group', function() {
        beforeEach(function() {
          analytics.stub(window._ramen, 'group');
          analytics.stub(window._ramen, 'identify');
        });

        it('should call _ramen.group', function() {
          analytics.group('id1');
          analytics.didNotCall(window._ramen.identify);
          analytics.called(window._ramen.group, {
            id: 'id1'
          });
        });
      });

      describe('#track', function() {
        beforeEach(function() {
          analytics.stub(window._ramen, 'track');
          analytics.stub(window._ramen, 'identify');
        });

        it('should call _ramen.track with just event name', function() {
          analytics.track('New Signup');
          analytics.didNotCall(window._ramen.identify);
          analytics.called(window._ramen.track, 'New Signup');
        });
      });
    });

    describe('before calling #identify', function() {
      describe('#page', function() {
        beforeEach(function() {
          analytics.stub(window._ramen, 'page');
          analytics.stub(window._ramen, 'identify');
        });

        it('should call _ramen.page & _ramen.identify', function() {
          analytics.page();
          analytics.called(window._ramen.identify);
          analytics.called(window._ramen.page);
        });
      });

      describe('#group', function() {
        beforeEach(function() {
          analytics.stub(window._ramen, 'group');
          analytics.stub(window._ramen, 'identify');
        });

        it('should call _ramen.group', function() {
          analytics.group('id1');
          analytics.called(window._ramen.identify);
          analytics.called(window._ramen.group, {
            id: 'id1'
          });
        });
      });

      describe('#track', function() {
        beforeEach(function() {
          analytics.stub(window._ramen, 'track');
          analytics.stub(window._ramen, 'identify');
        });

        it('should call _ramen.track with just event name', function() {
          analytics.track('New Signup');
          analytics.called(window._ramen.identify);
          analytics.called(window._ramen.track, 'New Signup');
        });
      });

      describe('#identify', function() {
        beforeEach(function() {
          analytics.stub(window._ramen, 'identify');
        });

        it('should not call _ramen.identify if no id is passed', function() {
          analytics.identify({ a_trait: 11 });
          analytics.didNotCall(window._ramen.identify);
        });

        it('should call _ramen.identify with the id', function() {
          analytics.identify('users-id');
          analytics.called(window._ramen.identify, {
            id: 'users-id',
            traits: {}
          }, {});
        });

        it('should call _ramen.identify and set correct attributes if just email passed', function() {
          var email = 'email@example.com';
          analytics.identify('id', { email: email });
          analytics.called(window._ramen.identify, {
            id: 'id',
            email: email,
            traits: {}
          }, {});
        });

        it('should call _ramen.identify and set correct attributes if email, name, & trait passed', function() {
          var email = 'email@example.com';
          var name = 'ryan+segment@ramen.is';
          analytics.identify('id', { email: email, name: name, is_friend: true });

          analytics.called(window._ramen.identify, {
            id: 'id',
            email: email,
            name: name,
            traits: { is_friend: true }
          }, {});
        });

        it('should pass along company traits', function() {
          var email = 'email@example.com';
          var name = 'ryan+segment@ramen.is';
          var company = {
            name: 'Pied Piper, Inc.',
            url: 'http://piedpiper.com',
            id: '987',
            createdAt: '2009-02-13T23:31:30.000Z',
            is_friend: true,
            used_coupon_at: 1234567890
          };

          analytics.identify('19', { email: email, name: name, company: company });

          analytics.called(window._ramen.identify, {
            id: '19',
            email: email,
            name: name,
            company: {
              name: 'Pied Piper, Inc.',
              url: 'http://piedpiper.com',
              id: '987',
              created_at: 1234567890,
              is_friend: true,
              used_coupon_at: 1234567890
            },
            traits: {}
          }, {});
        });

        it('should pass other traits', function() {
          var email = 'email@example.com';
          var name = 'ryan+segment@ramen.is';
          analytics.identify('id', {
            email: email,
            name: name,
            age: 32,
            score: 43.1,
            color: 'green',
            is_friend: true,
            became_maven_at: 1234567890,
            first_purchase_at: '2009-02-13T23:31:31.000Z',
            lastPurchaseAt: '2009-02-13T23:31:32.000Z'
          });

          analytics.called(window._ramen.identify, {
            id: 'id',
            email: email,
            name: name,
            traits: {
              age: 32,
              score: 43.1,
              color: 'green',
              is_friend: true,
              became_maven_at: 1234567890,
              first_purchase_at: 1234567891,
              lastPurchaseAt: 1234567892
            }
          }, {});
        });

        it('should pass along integration options', function() {
          var email = 'email@example.com';
          var name = 'ryan+segment@ramen.is';
          var auth_hash = 'authy_hasy';
          var auth_hash_timestamp = new Date() / 1000;
          var custom_links = [{ href: 'https://ramen.is/support', title: 'Hello' }];
          var labels = ['use', 'ramen!'];
          var environment = 'staging';
          var logged_in_url = 'https://align.ramen.is/manage';
          var unknown_future_opt = '11';
          var unknown_future_user_opt = 'user 11';

          analytics.identify('id', { email: email, name: name },
            {
              integrations: {
                Ramen: {
                  unknown_future_opt: unknown_future_opt,
                  environment: environment,
                  auth_hash_timestamp: auth_hash_timestamp,
                  auth_hash: auth_hash,
                  custom_links: custom_links,
                  user: {
                    unknown_future_user_opt: unknown_future_user_opt,
                    labels: labels,
                    logged_in_url: logged_in_url
                  }
                }
              }
            }
          );

          analytics.called(window._ramen.identify, {
            id: 'id',
            email: email,
            name: name,
            traits: {}
          }, {
            unknown_future_opt: unknown_future_opt,
            environment: environment,
            auth_hash: auth_hash,
            custom_links: custom_links,
            user: {
              unknown_future_user_opt: unknown_future_user_opt,
              labels: labels,
              logged_in_url: logged_in_url
            },
            timestamp: auth_hash_timestamp
          });
        });
      });
    });
  });
});
