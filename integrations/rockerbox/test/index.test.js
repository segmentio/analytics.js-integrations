'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Rockerbox = require('../lib/');

describe('Rockerbox', function() {
  var rockerbox;
  var analytics;
  var options = {
    // 'bonobos',
    source: 'source',
    // '1631414',
    allAnSeg: 'allAnSeg',
    // '1675564',
    customerAnSeg: 'customerAnSeg',
    events: [
      {
        key: 'signup',
        value: {
          conversionId: 'c36462a3',
          segmentId: '45'
        }
      },
      {
        key: 'login',
        value: {
          conversionId: '6137ab24',
          segmentId: '50',
          property: 'userId'
        }
      },
      {
        key: 'play',
        value: {
          conversionId: 'e3196de1',
          segmentId: '10',
          property: 'orderId'
        }
      }
    ]
  };

  beforeEach(function() {
    analytics = new Analytics();
    rockerbox = new Rockerbox(options);
    analytics.use(Rockerbox);
    analytics.use(tester);
    analytics.add(rockerbox);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    rockerbox.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(Rockerbox, integration('Rockerbox')
      .option('source', '')
      .option('allAnSeg', '')
      .option('customerAnSeg', '')
      .option('conversionId', '')
      .option('segmentId', '')
      .mapping('events'));
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.spy(rockerbox, 'load');
      });

      it('should load the pixel on every page', function() {
        analytics.page();
        analytics.loaded('<script src="https://getrockerbox.com/pixel'
          + '?source=' + options.source
          + '&type=imp'
          + '&an_seg=' + options.allAnSeg
          + '">');
      });

      it('shouldn\'t load customer pixel if not identified', function() {
        analytics.page();
        analytics.calledOnce(rockerbox.load);
      });

      it('should load customer pixel if identified', function() {
        analytics.identify('id', {
          firstName: 'john',
          lastName: 'doe',
          email: 'my@email.com'
        });

        analytics.page();
        analytics.loaded('<script src="https://getrockerbox.com/pixel'
          + '?source=' + options.source
          + '&type=imp'
          + '&an_seg=' + options.customerAnSeg
          + '">');

        analytics.assert(rockerbox.load.calledTwice);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.spy(rockerbox, 'load');
      });

      it('should not send if event is not defined', function() {
        analytics.track('toString', {});
        analytics.didNotCall(rockerbox.load);
      });

      it('should send event if found', function() {
        analytics.user().id('id');
        analytics.user().traits({ email: 'example@email.com' });
        analytics.track('signup');
        var event = options.events[0].value;
        analytics.loaded('<script src="https://secure.adnxs.com/px'
          + '?id=' + event.conversionId
          + '&seg=' + event.segmentId
          + '&t=1'
          + '&order_id=' + 'example@email.com'
          + '">');
        analytics.loaded('<script src="https://getrockerbox.com/pixel'
          + '?source=' + options.source
          + '&type=conv'
          + '&id=' + event.conversionId
          + '&an_seg=' + event.segmentId
          + '&order_type=' + 'example@email.com'
          + '">');
      });

      it('should use custom property for id if defined', function() {
        analytics.user().id('id');
        analytics.user().traits({ email: 'example@email.com' });
        analytics.track('play', { orderId: 123 });
        var event = options.events[2].value;
        analytics.loaded('<script src="https://secure.adnxs.com/px'
          + '?id=' + event.conversionId
          + '&seg=' + event.segmentId
          + '&t=1'
          + '&order_id=123'
          + '">');
        analytics.loaded('<script src="https://getrockerbox.com/pixel'
          + '?source=' + options.source
          + '&type=conv'
          + '&id=' + event.conversionId
          + '&an_seg=' + event.segmentId
          + '&order_type=123'
          + '">');
      });
    });
  });
});
