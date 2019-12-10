'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Intercom = require('../lib/');

describe('Intercom', function() {
  var analytics;
  var intercom;
  var options = {
    appId: 'a3vy8ufv',
    blacklisted: {
      stringifyMe: 'stringify',
      flattenMe: 'flatten',
      dropMe: 'drop'
    },
    defaultMethod: 'flatten',
    richLinkProperties: []
  };

  beforeEach(function() {
    analytics = new Analytics();
    intercom = new Intercom(options);
    analytics.use(Intercom);
    analytics.use(tester);
    analytics.add(intercom);
  });

  afterEach(function(done) {
    analytics.restore();
    analytics.reset();
    intercom.reset();
    sandbox();
    done();
  });

  it('should have the right settings', function() {
    analytics.compare(Intercom, integration('Intercom')
      .global('Intercom')
      .option('activator', '#IntercomDefaultWidget')
      .option('appId', '')
      .option('richLinkProperties', [])
      .tag('<script src="https://widget.intercom.io/widget/{{ appId }}">'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(intercom, 'load');
    });

    describe('#initialize', function() {
      it('should create window.Intercom', function() {
        analytics.assert(!window.Intercom);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.Intercom);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(intercom.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(intercom, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'Intercom');
      });

      it('should call boot first and update subsequently', function() {
        analytics.page();
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId
        });

        analytics.page();
        analytics.called(window.Intercom, 'update', {
          app_id: options.appId
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window, 'Intercom');
      });

      it('should call boot first and update subsequently', function() {
        analytics.identify('id');
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          id: 'id'
        });

        analytics.identify('id');
        analytics.called(window.Intercom, 'update', {
          app_id: options.appId,
          user_id: 'id',
          id: 'id'
        });
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { email: 'email@example.com' });
        analytics.called(window.Intercom, 'boot', {
          email: 'email@example.com',
          app_id: options.appId,
          user_id: 'id',
          id: 'id'
        });
      });

      it('should send user name', function() {
        analytics.identify('id', { name: 'john doe' });
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          name: 'john doe',
          id: 'id'
        });
      });

      it('should send first and last as name', function() {
        analytics.identify('id', { firstName: 'john', lastName: 'doe' });
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          firstName: 'john',
          lastName: 'doe',
          name: 'john doe',
          id: 'id'
        });
      });

      it('should respect .name, .firstName and .lastName', function() {
        analytics.identify('id', { firstName: 'john', lastName: 'doe', name: 'baz' });
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          firstName: 'john',
          lastName: 'doe',
          name: 'baz',
          id: 'id'
        });
      });

      it('should send custom traits', function() {
        analytics.identify('id', { album: 'Starboy' });
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          album: 'Starboy',
          id: 'id'
        });
      });

      it('should drop arrays or objects in traits', function() {
        analytics.identify('id', {
          dropMe: { foo: 'bar', ahoy: { okay: 'hello' } },
          stringifyMe: [{ a: 'b' }],
          flattenMe: { pizza: 'cheese', spongebob: { patrick: 'star' } }
        });
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          id: 'id'
        });
      });

      describe('date handling', function() {
        it('should accept `Date` instances', function() {
          var date = new Date();

          analytics.identify('id', {
            created: date,
            company: { created: date }
          });

          analytics.called(window.Intercom, 'boot', {
            app_id: options.appId,
            user_id: 'id',
            created_at: Math.floor(date / 1000),
            company: { created_at: Math.floor(date / 1000) },
            id: 'id'
          });
        });

        it('should handle ISO datestrings', function() {
          var date = new Date();
          var isoDate = date.toISOString();
          var unixDate = Math.floor(date / 1000);

          analytics.identify('12345', {
            createdAt: isoDate,
            company: { created: isoDate }
          });

          analytics.called(window.Intercom, 'boot', {
            app_id: options.appId,
            user_id: '12345',
            created_at: unixDate,
            company: { created_at: unixDate },
            id: '12345'
          });
        });

        it('should accept Unix timestamps (in seconds)', function() {
          var date = Math.floor(new Date().getTime() / 1000);

          analytics.identify('12345', {
            createdAt: date,
            company: { created: date }
          });

          analytics.called(window.Intercom, 'boot', {
            app_id: options.appId,
            user_id: '12345',
            created_at: date,
            company: { created_at: date },
            id: '12345'
          });
        });

        it('should accept Unix timestamps (in milliseconds)', function() {
          var date = new Date().getTime();

          analytics.identify('12345', {
            createdAt: date,
            company: { created: date }
          });

          analytics.called(window.Intercom, 'boot', {
            app_id: options.appId,
            user_id: '12345',
            created_at: Math.floor(date / 1000),
            company: { created_at: Math.floor(date / 1000) },
            id: '12345'
          });
        });
      });

      it('should allow passing a user hash', function() {
        analytics.identify('id', {}, {
          Intercom: { userHash: 'x' }
        });
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          user_hash: 'x',
          id: 'id'
        });
      });

      it('should send widget settings if the activator isnt the default one.', function() {
        intercom.options.activator = '#my-widget';
        analytics.identify('id');
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          id: 'id',
          widget: {
            activator: '#my-widget'
          }
        });
      });

      it('should not send activator if its the default one.', function() {
        analytics.identify('id');
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          id: 'id'
        });
      });

      it('should not fail when the company trait is a string', function() {
        analytics.identify('id', { company: 'string' });
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          id: 'id'
        });
      });

      it('should not fail when the company trait is a number', function() {
        analytics.identify('id', { company: 97 });
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          id: 'id'
        });
      });

      it('should carry over company traits set in group if a company trait exists', function() {
        analytics.group().traits({ foo: 'bar' });
        analytics.identify('id', { company: { name: 'name' } });
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          id: 'id',
          company: {
            name: 'name',
            foo: 'bar'
          }
        });
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window, 'Intercom');
      });

      it('should send an id', function() {
        analytics.group('id');
        analytics.called(window.Intercom, 'update', { company: { id: 'id' } });
      });

      it('should send map monthlySpend to monthly_spend', function() {
        analytics.group('id', { monthlySpend: 17.38 });
        analytics.called(window.Intercom, 'update', { company: { id: 'id', monthly_spend: 17.38 } });
      });

      it('should send an id and properties', function() {
        analytics.group('id', { name: 'Name' });
        analytics.called(window.Intercom, 'update', {
          company: {
            id: 'id',
            name: 'Name'
          }
        });
      });

      it('should work with .created_at', function() {
        var date = Date.now();
        date = Math.floor(date / 1000);
        analytics.group('id', { name: 'Name', createdAt: date });
        analytics.called(window.Intercom, 'update', {
          company: {
            id: 'id',
            name: 'Name',
            created_at: date
          }
        });
      });

      it('should work with .created', function() {
        var date = Date.now();
        date = Math.floor(date / 1000);
        analytics.group('id', { name: 'Name', created: date });
        analytics.called(window.Intercom, 'update', {
          company: {
            id: 'id',
            name: 'Name',
            created_at: date
          }
        });
      });

      it('should send custom traits', function() {
        analytics.group('id', { album: 'Starboy' });
        analytics.called(window.Intercom, 'update', {
          company: {
            album: 'Starboy',
            id: 'id'
          }
        });
      });

      it('should drop arrays or objects in traits', function() {
        analytics.group('id', {
          dropMe: { foo: 'bar', ahoy: { okay: 'hello' } },
          stringifyMe: [{ a: 'b' }],
          flattenMe: { pizza: 'cheese', spongebob: { patrick: 'star' } }
        });
        analytics.called(window.Intercom, 'update', {
          company: {
            id: 'id'
          }
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'Intercom');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window.Intercom, 'trackEvent', 'event', {});
      });

      it('should map price correctly', function() {
        analytics.track('event', { revenue: 200.00, currency: 'USD' });
        analytics.called(window.Intercom, 'trackEvent', 'event', { price: { amount: 20000, currency: 'USD' } });
      });

      it('should send custom traits', function() {
        analytics.track('event', { album: 'Starboy' });
        analytics.called(window.Intercom, 'trackEvent', 'event', {
          album: 'Starboy'
        });
      });

      it('should drop arrays or objects in properties', function() {
        analytics.track('event', {
          dropMe: { foo: 'bar', ahoy: { okay: 'hello' } },
          stringifyMe: [{ a: 'b' }],
          flattenMe: { pizza: 'cheese', spongebob: { patrick: 'star' } },
          suh: 'dude'
        });
        analytics.called(window.Intercom, 'trackEvent', 'event', {
          suh: 'dude'
        });
      });

      it('should send Rich Link as nested object', function() {
        intercom.options.richLinkProperties = ['article', 'orderNumber'];

        analytics.track('event', {
          article: {
            url: 'www.suh.com',
            value: 'suh dude'
          }
        });
        analytics.called(window.Intercom, 'trackEvent', 'event', {
          article: {
            url: 'www.suh.com',
            value: 'suh dude'
          }
        });
      });
    });

    describe('integration settings', function() {
      beforeEach(function() {
        analytics.stub(window, 'Intercom');
      });

      it('page: should set hide_default_launcher if integration setting exists for it', function() {
        var integrationSettings = {
          Intercom: { hideDefaultLauncher: true }
        };
        analytics.page({}, integrationSettings);
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          hide_default_launcher: true
        });
      });

      it('identify: should set hide_default_launcher if integration setting exists for it', function() {
        var integrationSettings = {
          Intercom: { hideDefaultLauncher: true }
        };
        analytics.identify('id', {}, integrationSettings);
        analytics.called(window.Intercom, 'boot', {
          app_id: options.appId,
          user_id: 'id',
          id: 'id',
          hide_default_launcher: true
        });
      });

      it('group: should set hide_default_launcher if integration setting exists for it', function() {
        var integrationSettings = {
          Intercom: { hideDefaultLauncher: true }
        };
        analytics.group('id', {}, integrationSettings);
        analytics.called(window.Intercom, 'update', {
          company: { id: 'id' },
          hide_default_launcher: true
        });
      });
    });
  });
});
