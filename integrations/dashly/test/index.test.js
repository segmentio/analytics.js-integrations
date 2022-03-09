'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var clone = require('@ndhoule/clone');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Dashly = require('../lib/');

describe('Dashly', function() {
  var analytics;
  var dashly;
  var options = {
    apiKey: '1234567890'
  };

  beforeEach(function() {
    analytics = new Analytics();
    dashly = new Dashly(options);
    analytics.use(Dashly);
    analytics.use(tester);
    analytics.add(dashly);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    dashly.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Dashly,
      integration('Dashly')
        .assumesPageview()
        .global('dashly')
        .global('dashlyasync')
        .option('apiKey', null)
        .tag('<script src="//cdn.dashly.app/api.min.js"></script>')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(dashly, 'load');
    });

    describe('#initialize', function() {
      it('should create window.dashly and window.dashlyasync', function() {
        analytics.assert(!window.dashly);
        analytics.assert(!window.dashlyasync);
        analytics.initialize();
        analytics.page();
        analytics.assert(window.dashly);
        analytics.assert(window.dashlyasync);
      });

      it('should create default methods of window.dashly', function() {
        analytics.initialize();
        analytics.page();
        analytics.assert(window.dashly.addCallback);
        analytics.assert(window.dashly.auth);
        analytics.assert(window.dashly.connect);
        analytics.assert(window.dashly.identify);
        analytics.assert(window.dashly.onReady);
        analytics.assert(window.dashly.open);
        analytics.assert(window.dashly.removeCallback);
        analytics.assert(window.dashly.track);
        analytics.assert(window.dashly.trackMessageInteraction);
      });

      it('should store window.dashly.connect call with correct api key in window.dashlyasync', function() {
        analytics.initialize();
        analytics.page();
        analytics.equal(window.dashlyasync[0], 'connect');
        analytics.equal(window.dashlyasync[1][0], options.apiKey, {
          connectionSource: 'Segment'
        });
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.page();
        analytics.called(dashly.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(dashly, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    it('should have correct apiKey', function() {
      analytics.equal(window.dashly.apikey, options.apiKey);
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window.dashly, 'identify');
      });

      it('should call window.dashly.identify to send traits', function() {
        analytics.identify('id', { email: 'johndoe@gmail.com' });
        analytics.called(window.dashly.identify, {
          segment_id: 'id',
          $email: 'johndoe@gmail.com'
        });
      });

      it('should call window.dashly.auth if user hash and user id are specified and set authorized to true', function() {
        analytics.stub(window.dashly, 'auth');
        analytics.identify(
          'id',
          {},
          {
            Dashly: {
              userHash: 'hash'
            }
          }
        );
        analytics.called(window.dashly.auth, 'id', 'hash');
        analytics.equal(dashly.authorized, true);
      });

      it('should not call window.dashly.auth if user id is not specified', function() {
        analytics.stub(window.dashly, 'auth');
        analytics.identify(
          {},
          {
            Dashly: {
              userHash: 'hash'
            }
          }
        );
        analytics.didNotCall(window.dashly.auth);
      });

      it('should not call window.dashly.auth if user hash is not specified', function() {
        analytics.stub(window.dashly, 'auth');
        analytics.identify('id');
        analytics.didNotCall(window.dashly.auth);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window.dashly, 'track');
      });

      it('should call window.dashly.track to send an event', function() {
        analytics.track('event', {
          prop1: '1',
          prop2: '2'
        });
        analytics.called(window.dashly.track, 'event', {
          prop1: '1',
          prop2: '2'
        });
      });
    });
  });

  describe('formatEvent', function() {
    function trackMockFactory(eventName, properties) {
      return {
        event: function() {
          return eventName;
        },
        properties: function(aliases) {
          var copiedProperties = clone(properties);
          // eslint-disable-next-line no-param-reassign
          aliases = aliases || {};

          Object.keys(aliases).forEach(function(alias) {
            if (copiedProperties[alias] != null) {
              copiedProperties[aliases[alias]] = copiedProperties[alias];
              delete copiedProperties[alias];
            }
          });

          return copiedProperties;
        }
      };
    }

    var testCasesData = [
      {
        formatted: true, // does event should be formatted
        segmentEventName: 'Order Completed', // event name before formatting
        formattedEventName: '$order_completed', // event name after formatting
        formattedEventProperties: {
          // properties before formatting
          order_id: '1234567890',
          total: '99,99',
          checkout_id: '314159265'
        },
        resultEventProperties: {
          // properties after formatting
          $order_amount: '99,99',
          $order_id: '1234567890',
          checkout_id: '314159265'
        }
      },
      {
        formatted: true,
        segmentEventName: 'Product Viewed',
        formattedEventName: '$product_viewed',
        formattedEventProperties: {
          image_url: 'https://url.to/image.png',
          name: 'Product',
          price: '9.99',
          url: 'https://url.to/product',
          product_id: '12345'
        },
        resultEventProperties: {
          $img: 'https://url.to/image.png',
          $name: 'Product',
          $amount: '9.99',
          $url: 'https://url.to/product',
          product_id: '12345'
        }
      },
      {
        formatted: true,
        segmentEventName: 'Product Added',
        formattedEventName: '$cart_added',
        formattedEventProperties: {
          image_url: 'https://url.to/image.png',
          name: 'Product',
          price: '9.99',
          url: 'https://url.to/product',
          product_id: '12345'
        },
        resultEventProperties: {
          $img: 'https://url.to/image.png',
          $name: 'Product',
          $amount: '9.99',
          $url: 'https://url.to/product',
          product_id: '12345'
        }
      },
      {
        formatted: true,
        segmentEventName: 'Signed In',
        formattedEventName: '$authorized',
        formattedEventProperties: {
          username: 'johndoe'
        },
        resultEventProperties: {
          $name: 'johndoe'
        }
      },
      {
        formatted: true,
        segmentEventName: 'Signed Up',
        formattedEventName: '$registered',
        formattedEventProperties: {
          email: 'johndoe@gmail.com',
          username: 'johndoe',
          first_name: 'John'
        },
        resultEventProperties: {
          $email: 'johndoe@gmail.com',
          $name: 'johndoe',
          first_name: 'John'
        }
      },
      {
        formatted: false,
        segmentEventName: 'Product Clicked',
        formattedEventName: 'Product Clicked',
        formattedEventProperties: {
          category: 'John',
          image_url: 'https://url.to/image.png',
          name: 'Product',
          price: '9.99',
          product_id: '12345',
          sku: 'P-1',
          url: 'https://url.to/product'
        },
        resultEventProperties: {
          category: 'John',
          image_url: 'https://url.to/image.png',
          name: 'Product',
          price: '9.99',
          product_id: '12345',
          sku: 'P-1',
          url: 'https://url.to/product'
        }
      }
    ];

    testCasesData.forEach(function(testCaseData) {
      it(
        'should' +
          (testCaseData.formatted ? ' ' : ' not ') +
          "format '" +
          testCaseData.segmentEventName +
          "' event",
        function() {
          var trackMock = trackMockFactory(
            testCaseData.segmentEventName,
            testCaseData.formattedEventProperties
          );

          analytics.deepEqual(Dashly.formatEvent(trackMock), {
            name: testCaseData.formattedEventName,
            properties: testCaseData.resultEventProperties
          });
        }
      );
    });
  });

  describe('formatTraits', function() {
    function identifyMockFactory(traits) {
      return {
        traits: function(aliases) {
          var copiedTraits = clone(traits);
          // eslint-disable-next-line no-param-reassign
          aliases = aliases || {};

          Object.keys(aliases).forEach(function(alias) {
            if (copiedTraits[alias] != null) {
              copiedTraits[aliases[alias]] = copiedTraits[alias];
              delete copiedTraits[alias];
            }
          });

          return copiedTraits;
        }
      };
    }

    it('should format traits', function() {
      var traits = {
        id: 'id',
        createdAt: '2020-02-07T10:56:56Z',
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@gmail.com',
        phone: '+1(234)567-89-00',
        address: {
          city: 'San Francisco',
          country: 'USA',
          state: 'CA'
        }
      };

      var formattedTraits = {
        segment_id: 'id',
        created_at: '2020-02-07T10:56:56Z',
        $name: 'John Doe',
        $email: 'johndoe@gmail.com',
        $phone: '+1(234)567-89-00',
        address: {
          city: 'San Francisco',
          country: 'USA',
          state: 'CA'
        }
      };

      var identifyMock = identifyMockFactory(traits);

      analytics.deepEqual(Dashly.formatTraits(identifyMock), formattedTraits);
    });

    it('should merge firstName and lastName into $name', function() {
      var traits = {
        firstName: 'John',
        lastName: 'Doe'
      };

      var formattedTraits = {
        $name: 'John Doe'
      };

      var identifyMock = identifyMockFactory(traits);

      analytics.deepEqual(Dashly.formatTraits(identifyMock), formattedTraits);
    });

    it('should use name as $name instead of firstName and lastName', function() {
      var traits = {
        firstName: 'John',
        lastName: 'Doe',
        name: 'Richard Roe'
      };

      var formattedTraits = {
        $name: 'Richard Roe'
      };

      var identifyMock = identifyMockFactory(traits);

      analytics.deepEqual(Dashly.formatTraits(identifyMock), formattedTraits);
    });
  });
});
