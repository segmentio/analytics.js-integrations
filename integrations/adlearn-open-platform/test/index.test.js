'use strict';

var AdLearnOpenPlatform = require('../lib');
var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');

describe('AdLearn Open Platform', function() {
  var adLearnOpenPlatform;
  var analytics;
  var options = {
    retargetingPixelId: '1234',
    events: {
      conversion: 1989,
      'completed order': 1979
    }
  };

  beforeEach(function() {
    analytics = new Analytics();
    adLearnOpenPlatform = new AdLearnOpenPlatform(options);
    analytics.use(AdLearnOpenPlatform);
    analytics.use(tester);
    analytics.add(adLearnOpenPlatform);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    adLearnOpenPlatform.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      AdLearnOpenPlatform,
      integration('AdLearn Open Platform')
        .option('retargetingPixelId', '')
        .mapping('events')
    );
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.spy(adLearnOpenPlatform, 'load');
      });

      it('should always trigger the retargeting pixel', function() {
        analytics.page();
        analytics.loaded(
          '<img src="https://secure.leadback.advertising.com/adcedge/lb?site=695501&betr=1234"/>'
        );
      });

      it('should trigger the pixel if there is an existing user', function() {
        analytics.identify('userId');
        analytics.page();
        analytics.loaded(
          '<img src="https://secure.leadback.advertising.com/adcedge/lb?site=695501&betr=1234"/>'
        );
        analytics.loaded(
          '<img src="https://secure.leadback.advertising.com/adcedge/lb?site=695501&srvc=1&betr=1234=920204[720]"/>'
        );
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(adLearnOpenPlatform, 'load');
      });

      it('should not track unmapped events', function() {
        analytics.track('event');
        analytics.didNotCall(adLearnOpenPlatform.load);
      });

      describe('mapped events', function() {
        it('should track basic conversion with type', function() {
          analytics.track('conversion');
          analytics.loaded(
            '<img src="https://secure.ace-tag.advertising.com/action/type=1989/bins=1/rich=0/mnum=1516/logs=0/xsstr1=/xsstr2=/xssale=/xsmemid=/"/>'
          );
        });

        it('should track basic conversion with type and user ID', function() {
          analytics.identify('userId');
          analytics.track('conversion');
          analytics.loaded(
            '<img src="https://secure.ace-tag.advertising.com/action/type=1989/bins=1/rich=0/mnum=1516/logs=0/xsstr1=userId/xsstr2=/xssale=/xsmemid=/"/>'
          );
        });

        it('should track basic conversion with type, user ID, and ecommerce info', function() {
          analytics.identify('userId');
          analytics.track('completed order', {
            orderId: 'asdf',
            total: 123,
            products: [
              {
                id: '507f1f77bcf86cd799439011',
                sku: '45790-32',
                name: 'Monopoly: 3rd Edition',
                price: 19,
                quantity: 1,
                category: 'Games'
              },
              {
                id: '505bd76785ebb509fc183733',
                sku: '46493-32',
                name: 'Uno Card Game',
                price: 3,
                quantity: 2,
                category: 'Games'
              }
            ]
          });
          analytics.loaded(
            '<img src="https://secure.ace-tag.advertising.com/action/type=1979/bins=1/rich=0/mnum=1516/logs=0/xsstr1=userId/xsstr2=507f1f77bcf86cd799439011,505bd76785ebb509fc183733/xssale=123.00/xsmemid=asdf/"/>'
          );
        });
      });
    });
  });
});
