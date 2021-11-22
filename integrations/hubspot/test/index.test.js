'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var HubSpot = require('../lib/');

describe('HubSpot', function() {
  var analytics;
  var hubspot;
  var options = {
    portalId: 62515,
    loadFormsSdk: false,
    enableEuropeanDataCenter: false
  };

  beforeEach(function() {
    analytics = new Analytics();
    hubspot = new HubSpot(options);
    analytics.use(HubSpot);
    analytics.use(tester);
    analytics.add(hubspot);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    hubspot.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      HubSpot,
      integration('HubSpot')
        .assumesPageview()
        .global('_hsq')
        .global('hbspt')
        .option('loadFormsSdk', false)
        .option('portalId', null)
        .option('enableEuropeanDataCenter', false)
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(hubspot, 'load');
    });
    afterEach(function() {
      analytics.restore();
      analytics.reset();
      hubspot.reset();
      sandbox();
    });

    describe('#initialize', function() {
      it('should create window._hsq', function() {
        analytics.assert(!window._hsq);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._hsq instanceof Array);
      });
      it('should call #load', function() {
        analytics.initialize();
        analytics.called(hubspot.load);
      });
      it('initializes with global tag', function() {
        var hubspot;
        var options = {
          portalId: 62515,
          enableEuropeanDataCenter: false
        };

        analytics = new Analytics();
        hubspot = new HubSpot(options);
        analytics.use(HubSpot);
        analytics.use(tester);
        analytics.add(hubspot);

        analytics.stub(hubspot, 'load');

        analytics.initialize();
        analytics.called(hubspot.load, 'global-tag');
      });
      it('initializes with eu tag', function() {
        var hubspot;
        var options = {
          portalId: 62515,
          enableEuropeanDataCenter: true
        };

        analytics = new Analytics();
        hubspot = new HubSpot(options);
        analytics.use(HubSpot);
        analytics.use(tester);
        analytics.add(hubspot);

        analytics.stub(hubspot, 'load');

        analytics.initialize();
        analytics.called(hubspot.load, 'eu-tag');
      });
    });
  });

  describe('loading', function() {
    // It's currently very difficult to run multiple tests against the loading behavior of a third-party script.
    // Because Karma doesn't clear the full state of the browser between tests, we end up with errors from the Hubspot sdk saying that it is already loaded on the page.
    // For now, we are simply testing that the forms sdk and the analytics sdk both load if the loadFormsSdk option is true.
    // Ideally we would have a test here as well that ensure the form DOES NOT load if the option is false but limitations with Karma make this very tricky.
    // TODO: look into solutions for full browser refreshes between tests to ensure clean loading behavior.
    it('should load the analytics lib and the forms lib if that option is true', function(done) {
      hubspot.options.loadFormsSdk = true;
      analytics.load(hubspot, function() {
        try {
          var formsSdkLoaded = !!(window.hbspt && window.hbspt.forms);
          analytics.assert(
            formsSdkLoaded,
            'Expected Hubspot Forms SDK to be loaded on the page'
          );
          done();
        } catch (e) {
          done(e);
        }
      });
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
        analytics.stub(window._hsq, 'push');
      });

      it('should not send traits without an email', function() {
        analytics.identify('id');
        analytics.didNotCall(window._hsq.push);
      });

      it('should send traits with an email', function() {
        analytics.identify({ email: 'name@example.com' });
        analytics.called(window._hsq.push, [
          'identify',
          { email: 'name@example.com' }
        ]);
      });

      it('should send an id and traits with an email', function() {
        analytics.identify('id', { email: 'name@example.com' });
        analytics.called(window._hsq.push, [
          'identify',
          {
            id: 'id',
            email: 'name@example.com'
          }
        ]);
      });

      it('should convert dates to milliseconds', function() {
        var date = new Date();
        analytics.identify({
          email: 'name@example.com',
          date: date
        });
        analytics.called(window._hsq.push, [
          'identify',
          {
            email: 'name@example.com',
            date: date.getTime()
          }
        ]);
      });

      it('should normalize name fields to firstname and lastname', function() {
        analytics.identify({
          email: 'name@example.com',
          firstName: 'First',
          lastName: 'Last'
        });
        analytics.called(window._hsq.push, [
          'identify',
          {
            email: 'name@example.com',
            firstname: 'First',
            lastname: 'Last'
          }
        ]);
      });

      it('should lowercase any uppercase traits', function() {
        analytics.identify({
          email: 'name@example.com',
          yOlO: 'yolo'
        });
        analytics.called(window._hsq.push, [
          'identify',
          {
            email: 'name@example.com',
            yolo: 'yolo'
          }
        ]);
      });

      it('should replace all spaces (tab, new lines, ect) with _', function() {
        analytics.identify({
          email: 'name@example.com',
          'gogurts are\tlife\rand\vgood\ntoday\fhorray': 'yolo'
        });
        analytics.called(window._hsq.push, [
          'identify',
          {
            email: 'name@example.com',
            gogurts_are_life_and_good_today_horray: 'yolo'
          }
        ]);
      });

      it('should replace periods with _', function() {
        analytics.identify({
          email: 'name@example.com',
          'gogurts.are.life': 'yolo'
        });
        analytics.called(window._hsq.push, [
          'identify',
          {
            email: 'name@example.com',
            gogurts_are_life: 'yolo'
          }
        ]);
      });

      it('should fill in company name', function() {
        analytics.identify({
          email: 'name@example.com',
          company: {
            name: 'Example Company'
          }
        });
        analytics.called(window._hsq.push, [
          'identify',
          {
            email: 'name@example.com',
            company: 'Example Company'
          }
        ]);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._hsq, 'push');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window._hsq.push, [
          'trackEvent',
          'event',
          { id: 'event' }
        ]);
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window._hsq.push, [
          'trackEvent',
          'event',
          { property: true, id: 'event' }
        ]);
      });

      it('should convert dates to milliseconds', function() {
        var date = new Date();
        var ms = date.getTime();

        analytics.track('event', { date: date });
        analytics.called(window._hsq.push, [
          'trackEvent',
          'event',
          { date: ms, id: 'event' }
        ]);
      });

      it('should attach track.event to properties.id', function() {
        analytics.track('Viewed Product', {});
        analytics.called(window._hsq.push, [
          'trackEvent',
          'Viewed Product',
          { id: 'Viewed Product' }
        ]);
      });

      it('should move properties.id to properties._id', function() {
        analytics.track('Viewed Product', { id: '12345' });
        analytics.called(window._hsq.push, [
          'trackEvent',
          'Viewed Product',
          { id: 'Viewed Product', _id: '12345' }
        ]);
      });

      it('should send revenue as value', function() {
        analytics.track('Did Something Valuable', { id: '12345', revenue: 13 });
        analytics.called(window._hsq.push, [
          'trackEvent',
          'Did Something Valuable',
          { id: 'Did Something Valuable', _id: '12345', value: 13 }
        ]);
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._hsq, 'push');
      });

      it('should send a page view', function() {
        analytics.page();
        analytics.called(window._hsq.push, ['trackPageView']);
      });
    });
  });
});
