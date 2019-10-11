'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Quantcast = require('../lib/');

describe('Quantcast', function() {
  var analytics;
  var quantcast;
  var options = {
    pCode: 'p-ZDsjJUtp583Se'
  };

  beforeEach(function() {
    analytics = new Analytics();
    quantcast = new Quantcast(options);
    analytics.use(Quantcast);
    analytics.use(tester);
    analytics.add(quantcast);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    quantcast.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(Quantcast, integration('Quantcast')
      .assumesPageview()
      .global('_qevents')
      .global('__qc')
      .option('pCode', null)
      .option('advertise', false));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(quantcast, 'load');
    });

    describe('#initialize', function() {
      it('should push the pCode', function() {
        analytics.initialize();
        analytics.assert(window._qevents[0].qacct === options.pCode);
      });

      it('userId should be a string', function() {
        analytics.user().identify(1738);
        analytics.initialize();
        analytics.assert(window._qevents[0].uid === '1738');
      });

      it('should push the user id', function() {
        analytics.user().identify('id');
        analytics.initialize();
        analytics.assert(window._qevents[0].uid === 'id');
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(quantcast.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(quantcast, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._qevents, 'push');
      });

      describe('when advertise is false', function() {
        it('should push a refresh event with pCode', function() {
          analytics.page();
          analytics.called(window._qevents.push, {
            event: 'refresh',
            qacct: options.pCode
          });
        });

        it('should push the page name as a label', function() {
          analytics.page('Page Name');
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: 'Page Name',
            qacct: options.pCode
          });
        });

        it('should push the page name as a label without commas', function() {
          analytics.page('Page, Name');
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: 'Page Name',
            qacct: options.pCode
          });
        });

        it('should push the page category and name as labels', function() {
          analytics.page('Category', 'Page');
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: 'Category.Page',
            qacct: options.pCode
          });
        });

        it('should add the properties labels to the custom label string', function() {
          analytics.page('Category', 'Page', { label: 'TestLabel' });
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: 'Category.Page,TestLabel',
            qacct: options.pCode
          });
        });

        it('should add the explicit QC labels to the custom label string', function() {
          analytics.page('Category', 'Page', {}, { Quantcast: { labels: ['TestLabel', 'TestLabel2'] } });
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: 'Category.Page,TestLabel,TestLabel2',
            qacct: options.pCode
          });
        });

        it('should add properties labels and the explicit QC labels to the custom label string', function() {
          analytics.page('Category', 'Page', { label: 'TestLabel' }, { Quantcast: { labels: ['TestLabel1', 'TestLabel2'] } });
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: 'Category.Page,TestLabel,TestLabel1,TestLabel2',
            qacct: options.pCode
          });
        });

        it('should not send a label without name or category', function() {
          analytics.page();
          analytics.called(window._qevents.push, {
            event: 'refresh',
            qacct: options.pCode
          });
        });

        it('should push the user id', function() {
          analytics.user().identify('id');
          analytics.page();
          analytics.called(window._qevents.push, {
            event: 'refresh',
            qacct: options.pCode,
            uid: 'id'
          });
        });

        it('userId should be a string', function() {
          analytics.user().identify(1738);
          analytics.page();
          analytics.called(window._qevents.push, {
            event: 'refresh',
            qacct: options.pCode,
            uid: '1738'
          });
        });
      });

      describe('when advertise is true', function() {
        beforeEach(function() {
          quantcast.options.advertise = true;
        });

        it('should prefix with _fp.event', function() {
          analytics.page('Page Name');
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: '_fp.event.Page Name',
            qacct: options.pCode
          });
        });

        it('should send category and name', function() {
          analytics.page('Category Name', 'Page Name');
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: '_fp.event.Category Name.Page Name',
            qacct: options.pCode
          });
        });

        it('should fallback on default when no name is passed', function() {
          analytics.page();
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: '_fp.event.Default',
            qacct: options.pCode
          });
        });
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._qevents, 'push');
      });

      afterEach(function() {
        analytics.restore();
      });

      it('should update the user id', function() {
        analytics.identify('id');
        analytics.assert(window._qevents[0].uid === 'id');
      });

      it('userId should be stringified', function() {
        analytics.identify(1738);
        analytics.assert(window._qevents[0].uid === '1738');
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._qevents, 'push');
      });

      describe('when advertiser is false', function() {
        it('should push a click event', function() {
          analytics.track('event');
          analytics.called(window._qevents.push, {
            event: 'click',
            labels: 'event',
            qacct: options.pCode
          });
        });

        it('should push revenue for the event', function() {
          analytics.track('event', { revenue: 10.45 });
          analytics.called(window._qevents.push, {
            event: 'click',
            labels: 'event',
            qacct: options.pCode,
            revenue: '10.45'
          });
        });

        it('should push custom label from properties for the event', function() {
          analytics.track('event', { label: 'newLabel' });
          analytics.called(window._qevents.push, {
            event: 'click',
            labels: 'event,newLabel',
            qacct: options.pCode
          });
        });

        it('should strip special characters from labels', function() {
          analytics.track('event', { label: 'new-Label?' }, { Quantcast: { labels: ['other!', 'labels_test()'] } });
          analytics.called(window._qevents.push, {
            event: 'click',
            labels: 'event,newLabel,other,labelstest',
            qacct: options.pCode
          });
        });

        it('should push custom labels from QC labels for the event', function() {
          analytics.track('event', { label: 'newLabel' }, { Quantcast: { labels: ['other', 'labels'] } });
          analytics.called(window._qevents.push, {
            event: 'click',
            labels: 'event,newLabel,other,labels',
            qacct: options.pCode
          });
        });

        it('should push the user id', function() {
          analytics.user().identify('id');
          analytics.track('event');
          analytics.called(window._qevents.push, {
            event: 'click',
            labels: 'event',
            qacct: options.pCode,
            uid: 'id'
          });
        });

        it('should stringify userId', function() {
          analytics.user().identify(1738);
          analytics.track('event');
          analytics.called(window._qevents.push, {
            event: 'click',
            labels: 'event',
            qacct: options.pCode,
            uid: '1738'
          });
        });

        it('should push the orderid', function() {
          analytics.track('event', { orderId: '123' });
          analytics.called(window._qevents.push, {
            event: 'click',
            labels: 'event',
            qacct: options.pCode,
            orderid: '123'
          });
        });

        it('should convert orderId to string', function() {
          analytics.track('event', { orderId: 123 });
          analytics.called(window._qevents.push, {
            event: 'click',
            labels: 'event',
            qacct: options.pCode,
            orderid: '123'
          });
        });

        it('should handle order completed events', function() {
          analytics.track('order completed', {
            orderId: '780bc55',
            category: 'tech',
            total: 99.99,
            shipping: 13.99,
            tax: 20.99
          });
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: 'order completed',
            orderid: '780bc55',
            qacct: options.pCode,
            revenue: '99.99'
          });
        });

        it('should set repeat property if present', function() {
          analytics.track('order completed', {
            orderId: '780bc55',
            category: 'tech',
            total: 99.99,
            shipping: 13.99,
            tax: 20.99,
            repeat: false
          });
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: 'order completed',
            orderid: '780bc55',
            qacct: options.pCode,
            revenue: '99.99'
          });
        });

        it('should not set repeat label if repeat property not present', function() {
          analytics.track('order completed', {
            orderId: '780bc55',
            category: 'tech',
            total: 99.99,
            shipping: 13.99,
            tax: 20.99
          });
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: 'order completed',
            orderid: '780bc55',
            qacct: options.pCode,
            revenue: '99.99'
          });
        });

        it('should set repeat label to "repeat" if true', function() {
          analytics.track('order completed', {
            orderId: '780bc55',
            category: 'tech',
            total: 99.99,
            shipping: 13.99,
            tax: 20.99,
            repeat: true
          });
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: 'order completed',
            orderid: '780bc55',
            qacct: options.pCode,
            revenue: '99.99'
          });
        });
      });

      describe('when advertise is true', function() {
        it('should prefix with _fp.event', function() {
          quantcast.options.advertise = true;
          analytics.track('event');
          analytics.called(window._qevents.push, {
            event: 'click',
            labels: '_fp.event.event',
            qacct: options.pCode
          });
        });

        it('should handle order completed events', function() {
          quantcast.options.advertise = true;
          analytics.track('order completed', {
            orderId: '780bc55',
            category: 'tech',
            repeat: true,
            total: 99.99,
            shipping: 13.99,
            tax: 20.99
          });
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: '_fp.event.order completed,_fp.pcat.tech,_fp.customer.repeat',
            orderid: '780bc55',
            qacct: options.pCode,
            revenue: '99.99'
          });
        });

        it('should not include products for order completed events', function() {
          quantcast.options.advertise = true;
          analytics.track('order completed', {
            orderId: '780bc55',
            category: 'tech',
            total: 99.99,
            shipping: 13.99,
            tax: 20.99,
            products: [
              {
                productId: 'product_1',
                quantity: 1,
                price: 24.75,
                name: 'my product',
                sku: 'p-298'
              },
              {
                productId: 'product_2',
                quantity: 3,
                price: 24.75,
                name: 'other product',
                sku: 'p-299'
              }
            ]
          });
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: '_fp.event.order completed,_fp.pcat.tech',
            orderid: '780bc55',
            qacct: options.pCode,
            revenue: '99.99'
          });
        });

        describe('when advertiseProducts is true', function() {
          it('should handle include products for order completed events', function() {
            quantcast.options.advertise = true;
            quantcast.options.advertiseProducts = true;
            analytics.track('order completed', {
              orderId: '780bc55',
              category: 'tech',
              total: 99.99,
              shipping: 13.99,
              tax: 20.99,
              products: [
                {
                  productId: 'product_1',
                  quantity: 1,
                  price: 24.75,
                  name: 'my product',
                  sku: 'p-298'
                },
                {
                  productId: 'product_2',
                  quantity: 3,
                  price: 24.75,
                  name: 'other product',
                  sku: 'p-299'
                }
              ]
            });
            analytics.called(window._qevents.push, {
              event: 'refresh',
              labels: '_fp.event.order completed,_fp.pcat.tech,_fp.pcat.Name.my product,_fp.pcat.ProductID.product_1,_fp.pcat.SKU.p-298,_fp.pcat.Name.other product,_fp.pcat.ProductID.product_2,_fp.pcat.SKU.p-299,_fp.pcat.Quantity.4',
              orderid: '780bc55',
              qacct: options.pCode,
              revenue: '99.99'
            });
          });
        });

        it('should respect repeat:false as new customer', function() {
          quantcast.options.advertise = true;
          analytics.track('order completed', {
            orderId: '780bc55',
            category: 'tech',
            repeat: false,
            total: 99.99,
            shipping: 13.99,
            tax: 20.99
          });
          analytics.called(window._qevents.push, {
            event: 'refresh',
            labels: '_fp.event.order completed,_fp.pcat.tech,_fp.customer.new',
            orderid: '780bc55',
            qacct: options.pCode,
            revenue: '99.99'
          });
        });
      });
    });
  });
});
