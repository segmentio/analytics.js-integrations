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
    analytics.compare(SatisMeter, integration('SatisMeter')
      .global('satismeter')
      .option('apiKey', ''));
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
        analytics.called(window.satismeter, {
          writeKey: options.apiKey,
          userId: 'id',
          traits: {
          },
          type: 'identify'
        });
      });

      it('should send email', function() {
        analytics.identify('id', { email: 'email@example.com' });
        analytics.called(window.satismeter, {
          writeKey: options.apiKey,
          userId: 'id',
          traits: {
            email: 'email@example.com'
          },
          type: 'identify'
        });
      });

      it('should send user name', function() {
        analytics.identify('id', { name: 'john doe' });
        analytics.called(window.satismeter, {
          writeKey: options.apiKey,
          userId: 'id',
          traits: {
            name: 'john doe'
          },
          type: 'identify'
        });
      });

      it('should send signUpDate', function() {
        var now = new Date();
        analytics.identify('id', { createdAt: now });
        analytics.called(window.satismeter, {
          writeKey: options.apiKey,
          userId: 'id',
          traits: {
            createdAt: now
          },
          type: 'identify'
        });
      });

      it('should send custom traits', function() {
        analytics.identify('id', {
          translation: {
            FOLLOWUP: 'What can we improve'
          },
          language: 'en'
        });
        analytics.called(window.satismeter, {
          writeKey: options.apiKey,
          userId: 'id',
          traits: {
            translation: {
              FOLLOWUP: 'What can we improve'
            },
            language: 'en'
          },
          type: 'identify'
        });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'satismeter');
      });

      it('should send apiKey and user id', function() {
        analytics.user().id('id');
        analytics.page('Pricing');
        analytics.called(window.satismeter, {
          writeKey: options.apiKey,
          userId: 'id',
          type: 'page'
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
    analytics.compare(SatisMeter, integration('SatisMeter')
      .global('satismeter')
      .option('token', ''));
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
        analytics.called(window.satismeter, {
          writeKey: options.token,
          userId: 'id',
          traits: {
          },
          type: 'identify'
        });
      });

      it('should send email', function() {
        analytics.identify('id', { email: 'email@example.com' });
        analytics.called(window.satismeter, {
          writeKey: options.token,
          userId: 'id',
          traits: {
            email: 'email@example.com'
          },
          type: 'identify'
        });
      });

      it('should send user name', function() {
        analytics.identify('id', { name: 'john doe' });
        analytics.called(window.satismeter, {
          writeKey: options.token,
          userId: 'id',
          traits: {
            name: 'john doe'
          },
          type: 'identify'
        });
      });

      it('should send signUpDate', function() {
        var now = new Date();
        analytics.identify('id', { createdAt: now });
        analytics.called(window.satismeter, {
          writeKey: options.token,
          userId: 'id',
          traits: {
            createdAt: now
          },
          type: 'identify'
        });
      });

      it('should send custom traits', function() {
        analytics.identify('id', {
          translation: {
            FOLLOWUP: 'What can we improve'
          },
          language: 'en'
        });
        analytics.called(window.satismeter, {
          writeKey: options.token,
          userId: 'id',
          traits: {
            translation: {
              FOLLOWUP: 'What can we improve'
            },
            language: 'en'
          },
          type: 'identify'
        });
      });
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window, 'satismeter');
      });

      it('should send token and user id', function() {
        analytics.user().id('id');
        analytics.page('Pricing');
        analytics.called(window.satismeter, {
          writeKey: options.token,
          userId: 'id',
          type: 'page'
        });
      });
    });
  });
});
