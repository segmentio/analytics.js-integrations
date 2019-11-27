'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Piwik = require('../lib/');

describe('Piwik', function() {
  var analytics;
  var piwik;
  var options = {
    siteId: 42,
    url: 'https://demo.piwik.org'
  };

  beforeEach(function() {
    analytics = new Analytics();
    piwik = new Piwik(options);
    analytics.use(Piwik);
    analytics.use(tester);
    analytics.add(piwik);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    piwik.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Piwik, integration('Piwik')
      .global('_paq')
      .option('siteId', '')
      .option('url', null)
      .option('customVariableLimit', 5)
      .mapping('goals'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(piwik, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(piwik.load);
      });

      it('should push the id onto window._paq', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._paq[0], ['setSiteId', options.siteId]);
      });

      it('should push the url onto window._paq', function() {
        analytics.initialize();
        analytics.page();
        analytics.deepEqual(window._paq[1], ['setTrackerUrl', options.url + '/piwik.php']);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(piwik, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      it('should send a page view', function() {
        analytics.page();
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._paq, 'push');
      });

      it('should not send an identify call without a user id', function() {
        analytics.identify();
        analytics.didNotCall(window._paq.push);
      });

      it('should send an identify call with the user id', function() {
        analytics.identify(5000);
        analytics.called(window._paq.push, ['setUserId', '5000']);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._paq, 'push');
      });

      it('should send an event with category of All', function() {
        analytics.track('event');
        analytics.called(window._paq.push, ['trackEvent', 'All', 'event', undefined, undefined]);
      });

      it('should send an event with custom category, label, and value', function() {
        analytics.track('event', { category: 'category', label: 'label', value: 5 });
        analytics.called(window._paq.push, ['trackEvent', 'category', 'event', 'label', 5]);
      });

      it('should send an event with .revenue() as the value', function() {
        analytics.track('event', { revenue: 5 });
        analytics.called(window._paq.push, ['trackEvent', 'All', 'event', undefined, 5]);
      });

      it('should track goals', function() {
        piwik.options.goals = [{ key: 'goal', value: 1 }];
        analytics.track('goal');
        analytics.called(window._paq.push, ['trackGoal', 1, undefined]);
      });

      it('should send .revenue()', function() {
        piwik.options.goals = [{ key: 'goal', value: 2 }];
        analytics.track('goal', { revenue: 10 });
        analytics.called(window._paq.push, ['trackGoal', 2, 10]);
      });

      it('should send .total()', function() {
        piwik.options.goals = [{ key: 'completed order', value: 10 }];
        analytics.track('Completed Order', { total: 20 });
        analytics.called(window._paq.push, ['trackGoal', 10, 20]);
      });

      it('should send one custom variable', function() {
        analytics.track('event', { prop: true }, { integrations: { Piwik: { customVars: { 1: ['UserId', '6116'] } } } });
        analytics.called(window._paq.push, ['setCustomVariable', '1', 'UserId', '6116', 'page']);
      });

      it('should send multiple custom variables that get passed as cvar', function() {
        analytics.track('event',
          { prop: true },
          { integrations: {
            Piwik: {
              cvar: {
                1: ['UserId', '6116'],
                2: ['SubscriptionId', ''],
                3: ['PlanName', 'ENTERPRISE']
              }
            }
          }
          }
        );
        analytics.called(window._paq.push, ['setCustomVariable', '1', 'UserId', '6116', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '2', 'SubscriptionId', '', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '3', 'PlanName', 'ENTERPRISE', 'page']);
      });

      it('should send multiple custom variables that get passed as an customVars', function() {
        analytics.track('event',
          { prop: true },
          { integrations: {
            Piwik: {
              customVars: {
                1: ['UserId', '6116'],
                2: ['SubscriptionId', ''],
                3: ['PlanName', 'ENTERPRISE']
              }
            }
          }
          }
        );
        analytics.called(window._paq.push, ['setCustomVariable', '1', 'UserId', '6116', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '2', 'SubscriptionId', '', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '3', 'PlanName', 'ENTERPRISE', 'page']);
      });

      it('should\'t send custom variables that get passed in the wrong format', function() {
        analytics.track('event', { prop: true }, { integrations: { Piwik: { customVars: { UserId: '6116' } } } });
        analytics.didNotCall(window._paq.push, ['setCustomVariable', '1', 'UserId', '6116', 'page']);
      });

      it('should\'t send custom variables that are the wrong type', function() {
        analytics.track('event', { prop: true }, { integrations: { Piwik: { customVars: { UserId: { Not: 'aNumber' } } } } });
        analytics.didNotCall(window._paq.push, ['setCustomVariable', '1', 'UserId', { Not: 'aNumber' }, 'page']);
      });

      it('should\'t send custom variables that are empty', function() {
        analytics.track('event', { prop: true }, { integrations: { Piwik: { customVars: { UserId: '' } } } });
        analytics.didNotCall(window._paq.push, ['setCustomVariable', '1', 'UserId', '', 'page']);
      });

      it('shouldn\t send more than the \'customVariableLimit\' number of variables', function() {
        analytics.track('event',
          { prop: true },
          { integrations: {
            Piwik: {
              customVars: {
                1: ['UserId', '6116'],
                2: ['SubscriptionId', ''],
                3: ['PlanName', 'ENTERPRISE'],
                4: ['New', 'item'],
                5: ['LastVariable', '0824'],
                6: ['TooManyVars', 'OhNo'],
                7: ['ThisIsntAThing', 'Apples']
              }
            }
          }
          }
        );
        analytics.called(window._paq.push, ['setCustomVariable', '1', 'UserId', '6116', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '2', 'SubscriptionId', '', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '3', 'PlanName', 'ENTERPRISE', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '4', 'New', 'item', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '5', 'LastVariable', '0824', 'page']);
        analytics.didNotCall(window._paq.push, ['setCustomVariable', '6', 'TooManyVars', 'OhNo', 'page']);
        analytics.didNotCall(window._paq.push, ['setCustomVariable', '7', 'ThisIsntAThing', 'Apples', 'page']);
      });

      it('should send up to the \'customVariableLimit\' number of variables', function() {
        piwik.options.customVariableLimit = 10;
        analytics.track('event',
          { prop: true },
          { integrations: {
            Piwik: {
              customVars: {
                1: ['UserId', '6116'],
                2: ['SubscriptionId', ''],
                3: ['PlanName', 'ENTERPRISE'],
                4: ['New', 'item'],
                5: ['LastVariable', '0824'],
                6: ['TooManyVars', 'OhNo'],
                7: ['ThisIsntAThing', 'Apples']
              }
            }
          }
          }
        );
        analytics.called(window._paq.push, ['setCustomVariable', '1', 'UserId', '6116', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '2', 'SubscriptionId', '', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '3', 'PlanName', 'ENTERPRISE', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '4', 'New', 'item', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '5', 'LastVariable', '0824', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '6', 'TooManyVars', 'OhNo', 'page']);
        analytics.called(window._paq.push, ['setCustomVariable', '7', 'ThisIsntAThing', 'Apples', 'page']);
      });
    });
  });
});
