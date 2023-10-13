/*
 * These are the unit tests for the integration. They should NOT test the network nor any
 * remote third-party functionality - only that the local code acts and runs as expected.
 */

'use strict'

var Analytics = require('@segment/analytics.js-core').constructor
var Integration = require('@segment/analytics.js-integration')
var Sandbox = require('@segment/clear-env')
var Tester = require('@segment/analytics.js-integration-tester')
var Auryc = require('../lib/')

describe('Auryc Unit', function () {
    var analytics
    var _auryc
    var customOptions
    var options = {
        siteid: '519-TestProject'
    }

    beforeEach(function () {
        analytics = new Analytics()
        _auryc = new Auryc(options)
        analytics.use(Auryc)
        analytics.use(Tester)
        analytics.add(_auryc)

        customOptions = {
            siteid: '519-TestProject'
        }
    })

    afterEach(function () {
        analytics.restore()
        analytics.reset()
        _auryc.reset()
        Sandbox()
    })

    describe('Constructing the integration', function () {
        it('should have the right settings', function () {
            analytics.compare(Auryc, Integration('Auryc')
                .option('siteid', null))
        })

        it('should have the right settings with custom options', function () {
            _auryc = new Auryc(customOptions) // Intentionally creating a new Auryc integration here to not simply compare the object to itself.

            analytics.deepEqual(_auryc.options, customOptions)
        })
    })

     describe('before loading', function () {
        beforeEach(function () {
            analytics.stub(_auryc, 'load');
        });
        describe('#initialize', function () {
            it('should create window.auryc', function () {
                analytics.assert(!window.auryc);
                analytics.initialize();
                // analytics.assert(window.auryc);
                analytics.assert(window.aurycReadyCb);
            })

            it('should prepare the needed globals', function () {
                analytics.initialize()
                analytics.assert(window.aurycReadyCb);
            })
        })
    })

    describe('after loading', function() {
      beforeEach(function(done) {
        analytics.once('ready', done);
        analytics.initialize();
      });
  
      describe('#identify', function() {
        beforeEach(function() {
          analytics.stub(window.auryc, 'identify');
          analytics.stub(window.auryc, 'addUserProperties');
        });
  
        it('should send an id', function() {
          analytics.identify('userid');
          analytics.called(window.auryc.identify, 'userid');
          analytics.called(window.auryc.addUserProperties, {});
        });
  
        it('should send custom props', function() {
          analytics.identify('userid', { name: 'test_user', email: 'user@example.com'});
          analytics.called(window.auryc.identify, 'userid');
          analytics.called(window.auryc.addUserProperties, {name: 'test_user', email: 'user@example.com'});
        });

        it('should send custom array props', function() {
          analytics.identify('userid', { arr: [1, 2 ,3], arrObj: [{'key':{'innerkey':'value'}}]});
          analytics.called(window.auryc.addUserProperties, {arr: [1, 2 ,3], arrObj: '[{\"key\":{\"innerkey\":\"value\"}}]'});
        });

        it('should send custom object props', function() {
          analytics.identify('userid', { arr: {test: 123} });
          analytics.called(window.auryc.addUserProperties, {'arr.test': 123});
        });
      });
  
  
      describe('#track', function() {
        beforeEach(function() {
          analytics.stub(window.auryc, 'track');
        });
  
        it('should send track event name and properties', function() {
          analytics.track('test_event', { prop1: '123', prop2: 456, prop3: [123, 456], prop4: true });
          analytics.called(window.auryc.track, 'test_event', { prop1: '123', prop2: 456, prop3: [123, 456], prop4: true, auryc_integration: 'segment' });
        });

        it('should send track complex array properties', function() {
          analytics.track('test_event', { arrObj: [{test1: 123}] });
          analytics.called(window.auryc.track, 'test_event', {  arrObj: '[{\"test1\":123}]', auryc_integration: 'segment' });
        });

        it('should send track complex object properties', function() {
          analytics.track('test_event', { arrObj: {test1: {test2: 'nested'} } });
          analytics.called(window.auryc.track, 'test_event', {  "arrObj.test1.test2": "nested", auryc_integration: 'segment' });
        });

        it('should send track complex object properties case 2', function() {
          analytics.track('Completed Order Test', {"orderId":"6000315","total":"80.00","revenue":"60.00","shipping":"0.00",
          "tax":"0.00","discount":"20.00","coupon":"AURYCPARTNER25","currency":"USD",
          "products":[{"id":"48","name":"Longsleeve","sku":"","price":"80.00","quantity":1,"category":"T-shirts"}]});
          analytics.called(window.auryc.track, 'Completed Order Test', {"orderId":"6000315","total":"80.00","revenue":"60.00",
          "shipping":"0.00","tax":"0.00","discount":"20.00","coupon":"AURYCPARTNER25","currency":"USD",
          products: '[{\"id\":\"48\",\"name\":\"Longsleeve\",\"sku\":\"\",\"price\":\"80.00\",\"quantity\":1,\"category\":\"T-shirts\"}]',
          auryc_integration: 'segment'});
        });
      });

      describe('#group', function() {
        beforeEach(function() {
          analytics.stub(window.auryc, 'identify');
          analytics.stub(window.auryc, 'addUserProperties');
        });
  
        it('should send an id', function() {
          analytics.group('123456');
          analytics.called(window.auryc.addUserProperties, {groupId: '123456'});
        });

        it('should send group traits', function() {
          analytics.group("0e8c78ea9d97a7b8185e8632", {
            name: "Initech",
            industry: "Technology",
            employees: 329,
            plan: "enterprise",
            "total billed": 830
          });          
          analytics.called(window.auryc.addUserProperties, 
            {groupId: '0e8c78ea9d97a7b8185e8632',
            group_name: "Initech",
            group_industry: "Technology",
            group_employees: 329,
            group_plan: "enterprise",
            "group_total billed": 830}
            );
        });
      });
    });
})
