'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var SatisMeter = require('../lib/');

describe('SatisMeter', function() {
  var analytics;
  var satismeter;
  var options = {
    apiKey: 'xy1gopRgdl'
  };

  beforeEach(function() {
    analytics = new Analytics();
    satismeter = new SatisMeter(options);
    analytics.use(SatisMeter);
    analytics.use(tester);
    analytics.add(satismeter);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    satismeter.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      SatisMeter,
      integration('SatisMeter')
        .global('satismeter')
        .option('apiKey', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(satismeter, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();

        analytics.called(satismeter.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(satismeter, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window, 'satismeter');
      });

      it('should send apiKey and user id', function() {
        analytics.identify('id');
        var anonymousId = analytics.user().anonymousId();

        analytics.called(window.satismeter, 'identify', {
          userId: 'id',
          anonymousId: anonymousId,
          traits: {}
        });
      });

      it('should send email', function() {
        analytics.identify('id', { email: 'email@example.com' });
        var anonymousId = analytics.user().anonymousId();

        analytics.called(window.satismeter, 'identify', {
          userId: 'id',
          anonymousId: anonymousId,
          traits: {
            email: 'email@example.com'
          }
        });
      });

      it('should send user name', function() {
        analytics.identify('id', { name: 'john doe' });
        var anonymousId = analytics.user().anonymousId();

        analytics.called(window.satismeter, 'identify', {
          userId: 'id',
          anonymousId: anonymousId,
          traits: {
            name: 'john doe'
          }
        });
      });

      it('should send signUpDate', function() {
        var now = new Date();
        analytics.identify('id', { createdAt: now });
        var anonymousId = analytics.user().anonymousId();

        analytics.called(window.satismeter, 'identify', {
          userId: 'id',
          anonymousId: anonymousId,
          traits: {
            createdAt: now
          }
        });
      });

      it('should send custom traits', function() {
        analytics.identify('id', {
          translation: {
            FOLLOWUP: 'What can we improve'
          },
          language: 'en'
        });
        var anonymousId = analytics.user().anonymousId();

        analytics.called(window.satismeter, 'identify', {
          userId: 'id',
          anonymousId: anonymousId,
          traits: {
            translation: {
              FOLLOWUP: 'What can we improve'
            },
            language: 'en'
          }
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'satismeter');
      });

      it('should send event name and properties', function() {
        analytics.user().id('id');
        analytics.user().anonymousId('anonymousId');
        analytics.track('User Subscribed', {
          planId: 'Example Plan',
          planPrice: 2000
        });

        analytics.called(window.satismeter, 'track', {
          userId: 'id',
          anonymousId: 'anonymousId',
          event: 'User Subscribed',
          properties: {
            planId: 'Example Plan',
            planPrice: 2000
          }
        });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'satismeter');
      });

      it('should send page name, category and properties', function() {
        analytics.user().id('id');
        analytics.user().anonymousId('anonymousId');
        analytics.page('Product', 'Pricing', {
          customProperty: 'Example'
        });

        analytics.called(window.satismeter, 'page', {
          userId: 'id',
          anonymousId: 'anonymousId',
          name: 'Pricing',
          category: 'Product',
          properties: {
            name: 'Pricing',
            category: 'Product',
            path: window.location.pathname,
            referrer: window.document.referrer,
            search: window.location.search,
            title: window.document.title,
            url: window.location.href,
            customProperty: 'Example'
          }
        });
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window, 'satismeter');
      });

      it('should send group id and traits', function() {
        analytics.user().id('id');
        analytics.user().anonymousId('anonymousId');
        analytics.group('groupId', {
          industry: 'Technology',
          employees: 2000
        });

        analytics.called(window.satismeter, 'group', {
          userId: 'id',
          anonymousId: 'anonymousId',
          groupId: 'groupId',
          traits: {
            industry: 'Technology',
            employees: 2000
          }
        });
      });
    });
  });
});

describe('SatisMeter - legacy setup', function() {
  // to be removed once we complete the renaming from token to apiKey
  var analytics;
  var satismeter;
  var options = {
    token: 'xy1gopRgdl'
  };

  beforeEach(function() {
    analytics = new Analytics();
    satismeter = new SatisMeter(options);
    analytics.use(SatisMeter);
    analytics.use(tester);
    analytics.add(satismeter);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    satismeter.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      SatisMeter,
      integration('SatisMeter')
        .global('satismeter')
        .option('token', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(satismeter, 'load');
    });

    describe('#initialize', function() {
      it('should call #load', function() {
        analytics.initialize();

        analytics.called(satismeter.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(satismeter, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window, 'satismeter');
      });

      it('should send token and user id', function() {
        analytics.identify('id');
        var anonymousId = analytics.user().anonymousId();

        analytics.called(window.satismeter, 'identify', {
          userId: 'id',
          anonymousId: anonymousId,
          traits: {}
        });
      });

      it('should send email', function() {
        analytics.identify('id', { email: 'email@example.com' });
        var anonymousId = analytics.user().anonymousId();

        analytics.called(window.satismeter, 'identify', {
          userId: 'id',
          anonymousId: anonymousId,
          traits: {
            email: 'email@example.com'
          }
        });
      });

      it('should send user name', function() {
        analytics.identify('id', { name: 'john doe' });
        var anonymousId = analytics.user().anonymousId();

        analytics.called(window.satismeter, 'identify', {
          userId: 'id',
          anonymousId: anonymousId,
          traits: {
            name: 'john doe'
          }
        });
      });

      it('should send signUpDate', function() {
        var now = new Date();
        analytics.identify('id', { createdAt: now });
        var anonymousId = analytics.user().anonymousId();

        analytics.called(window.satismeter, 'identify', {
          userId: 'id',
          anonymousId: anonymousId,
          traits: {
            createdAt: now
          }
        });
      });

      it('should send custom traits', function() {
        analytics.identify('id', {
          translation: {
            FOLLOWUP: 'What can we improve'
          },
          language: 'en'
        });
        var anonymousId = analytics.user().anonymousId();

        analytics.called(window.satismeter, 'identify', {
          userId: 'id',
          anonymousId: anonymousId,
          traits: {
            translation: {
              FOLLOWUP: 'What can we improve'
            },
            language: 'en'
          }
        });
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window, 'satismeter');
      });

      it('should send event name and properties', function() {
        analytics.user().id('id');
        analytics.user().anonymousId('anonymousId');
        analytics.track('User Subscribed', {
          planId: 'Example Plan',
          planPrice: 2000
        });

        analytics.called(window.satismeter, 'track', {
          userId: 'id',
          anonymousId: 'anonymousId',
          event: 'User Subscribed',
          properties: {
            planId: 'Example Plan',
            planPrice: 2000
          }
        });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'satismeter');
      });

      it('should send page name, category and properties', function() {
        analytics.user().id('id');
        analytics.user().anonymousId('anonymousId');
        analytics.page('Product', 'Pricing', {
          customProperty: 'Example'
        });

        analytics.called(window.satismeter, 'page', {
          userId: 'id',
          anonymousId: 'anonymousId',
          name: 'Pricing',
          category: 'Product',
          properties: {
            name: 'Pricing',
            category: 'Product',
            path: window.location.pathname,
            referrer: window.document.referrer,
            search: window.location.search,
            title: window.document.title,
            url: window.location.href,
            customProperty: 'Example'
          }
        });
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window, 'satismeter');
      });

      it('should send group id and traits', function() {
        analytics.user().id('id');
        analytics.user().anonymousId('anonymousId');
        analytics.group('groupId', {
          industry: 'Technology',
          employees: 2000
        });

        analytics.called(window.satismeter, 'group', {
          userId: 'id',
          anonymousId: 'anonymousId',
          groupId: 'groupId',
          traits: {
            industry: 'Technology',
            employees: 2000
          }
        });
      });
    });
  });
});
