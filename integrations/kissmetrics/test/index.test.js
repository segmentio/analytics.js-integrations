'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var KISSmetrics = require('../lib/');

describe('KISSmetrics', function() {
  var analytics;
  var kissmetrics;
  var options;

  before(function() {
    // setup global that tell kissmetrics to not fire jsonp breaking requests
    window.KM_DNT = true;
    window.KMDNTH = true;
  });

  beforeEach(function() {
    options = {
      apiKey: '67f57ae9d61a6981fa07d141bec8c6c37e8b88c7'
    };

    analytics = new Analytics();
    kissmetrics = new KISSmetrics(options);
    analytics.use(KISSmetrics);
    analytics.use(tester);
    analytics.add(kissmetrics);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    kissmetrics.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(KISSmetrics, integration('KISSmetrics')
      .global('KM')
      .global('_kmil')
      .global('_kmq')
      .option('apiKey', '')
      .option('prefixProperties', true)
      .option('trackCategorizedPages', true)
      .option('trackNamedPages', true));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(kissmetrics, 'load');
      analytics.initialize();
    });

    describe('#initialize', function() {
      it('should create window._kmq', function() {
        analytics.assert(window._kmq instanceof Array);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(kissmetrics, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    it('should create window.KM', function() {
      analytics.assert(window.KM);
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._kmq, 'push');
        analytics.stub(window.KM, 'pageView');
      });

      afterEach(function() {
        // set back to defaults
        window.KM_SKIP_PAGE_VIEW = 1;
      });

      describe('when KM_SKIP_PAGE_VIEW is false', function() {
        beforeEach(function() {
          window.KM_SKIP_PAGE_VIEW = false;
        });

        it('should send a Page View event with the window URL and referrer', function() {
          analytics.page();
          analytics.called(window._kmq.push, ['record', 'Page View', {
            'Viewed URL': window.location.href,
            Referrer: document.referrer || 'Direct'
          }]);
        });

        describe('when a custom page is provided', function() {
          it('should send a Page View event with the page URL and referrer', function() {
            analytics.page('Name', {
              url: 'http://foo.com/',
              referrer: 'http://bar.com/'
            });
            analytics.called(window._kmq.push, ['record', 'Page View', {
              'Viewed URL': 'http://foo.com/',
              Referrer: 'http://bar.com/'
            }]);
          });
        });
      });

      it('should not send a Page View event on a call to page() when KM_SKIP_PAGE_VIEW is set', function() {
        kissmetrics.options.trackNamedPages = false;
        kissmetrics.options.trackCategoryPages = false;
        window.KM_SKIP_PAGE_VIEW = 1;
        analytics.page();
        analytics.didNotCall(window._kmq.push);
      });

      it('should track named pages by default', function() {
        analytics.page('Name', {
          title: document.title,
          url: window.location.href
        });
        analytics.called(window._kmq.push, ['record', 'Viewed Name Page', {
          'Page - title': document.title,
          'Page - url': window.location.href,
          'Page - path': window.location.pathname,
          'Page - referrer': document.referrer,
          'Page - search': window.location.search,
          'Page - name': 'Name'
        }]);
      });

      it('should not track a named page when the option is off, but should track category', function() {
        kissmetrics.options.trackNamedPages = false;
        analytics.page('Category', 'Name');
        analytics.calledOnce(window._kmq.push);
        analytics.called(window._kmq.push, ['record', 'Viewed Category Page', {
          'Page - path': window.location.pathname,
          'Page - referrer': document.referrer,
          'Page - title': document.title,
          'Page - search': window.location.search,
          'Page - name': 'Name',
          'Page - category': 'Category',
          'Page - url': window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search
        }]);
      });

      it('should not track a categorized page when the option is off, but should track name', function() {
        kissmetrics.options.trackCategorizedPages = false;
        analytics.page('Category', 'Name');
        analytics.calledOnce(window._kmq.push);
        analytics.called(window._kmq.push, ['record', 'Viewed Name Page', {
          'Page - title': document.title,
          'Page - url': window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search,
          'Page - path': window.location.pathname,
          'Page - referrer': document.referrer,
          'Page - search': window.location.search,
          'Page - name': 'Name',
          'Page - category': 'Category'
        }]);
      });

      it('should track only named page when both options are on', function() {
        analytics.page('Category', 'Name');
        analytics.calledOnce(window._kmq.push);
        analytics.called(window._kmq.push, ['record', 'Viewed Name Page', {
          'Page - title': document.title,
          'Page - url': window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname + window.location.search,
          'Page - path': window.location.pathname,
          'Page - referrer': document.referrer,
          'Page - search': window.location.search,
          'Page - name': 'Name',
          'Page - category': 'Category'
        }]);
      });

      it('should prefixProperties even if option is off', function() {
        kissmetrics.options.prefixProperties = false;
        analytics.page('Name', {
          title: document.title,
          url: window.location.href
        });
        analytics.called(window._kmq.push, ['record', 'Viewed Name Page', {
          'Page - title': document.title,
          'Page - url': window.location.href,
          'Page - name': 'Name',
          'Page - path': window.location.pathname,
          'Page - referrer': document.referrer,
          'Page - search': window.location.search
        }]);
      });
    });

    describe('#identify', function() {
      beforeEach(function() {
        analytics.stub(window._kmq, 'push');
      });

      it('should send an id', function() {
        analytics.identify('id');
        analytics.called(window._kmq.push, ['identify', 'id']);
      });

      it('should send traits', function() {
        analytics.identify({ trait: true });
        analytics.called(window._kmq.push, ['set', { trait: true }]);
      });

      it('should send an id and traits', function() {
        analytics.identify('id', { trait: true });
        analytics.called(window._kmq.push, ['identify', 'id']);
        analytics.called(window._kmq.push, ['set', { trait: true, id: 'id' }]);
      });

      it('should send stringify nested traits objects', function() {
        analytics.identify('id', { trait: { foo: 'bar' } });
        analytics.called(window._kmq.push, ['identify', 'id']);
        analytics.called(window._kmq.push, ['set', { 'trait.foo': 'bar', id: 'id' }]);
      });

      it('should send stringify arrays in nested traits objects', function() {
        analytics.identify('id', { trait: { foo: [1, 2, 3] } });
        analytics.called(window._kmq.push, ['identify', 'id']);
        analytics.called(window._kmq.push, ['set', { 'trait.foo': '1,2,3', id: 'id' }]);
      });
    });

    describe('#track', function() {
      beforeEach(function() {
        analytics.stub(window._kmq, 'push');
      });

      it('should send an event', function() {
        analytics.track('event');
        analytics.called(window._kmq.push, ['record', 'event', {}]);
      });

      it('should send an event and properties', function() {
        analytics.track('event', { property: true });
        analytics.called(window._kmq.push, ['record', 'event', {
          'event - property': true
        }]);
      });

      it('should alias revenue to "Billing Amount" and "revenue"', function() {
        analytics.track('event', { revenue: 9.99 });
        analytics.called(window._kmq.push, ['record', 'event', {
          'Billing Amount': 9.99,
          'event - revenue': 9.99
        }]);
      });

      it('should stringify nested objects', function() {
        analytics.track('event', {
          glenn: {
            coco: 'best halloween costume',
            mean: {
              girls: 'lindsey'
            }
          }
        });
        analytics.called(window._kmq.push, ['record', 'event', {
          'event - glenn.coco': 'best halloween costume',
          'event - glenn.mean.girls': 'lindsey'
        }]);
      });

      it('should stringify arrays inside nested objects', function() {
        analytics.track('event', {
          glenn: {
            coco: ['1', '2', '3']
          }
        });
        analytics.called(window._kmq.push, ['record', 'event', {
          'event - glenn.coco': '1,2,3'
        }]);
      });

      it('should discard null and undefined values inside nested objects', function() {
        analytics.track('event', {
          foo: 'bar',
          xy: null,
          baz: 'quux',
          zzy: undefined
        });
        analytics.called(window._kmq.push, ['record', 'event', {
          'event - foo': 'bar',
          'event - baz': 'quux'
        }]);
      });
    });

    describe('#alias', function() {
      beforeEach(function() {
        analytics.stub(window._kmq, 'push');
      });

      it('should send a new id', function() {
        analytics.alias('new');
        analytics.called(window._kmq.push, ['alias', 'new', undefined]);
      });

      it('should send a new and old id', function() {
        analytics.alias('new', 'old');
        analytics.called(window._kmq.push, ['alias', 'new', 'old']);
      });
    });

    describe('#group', function() {
      beforeEach(function() {
        analytics.stub(window._kmq, 'push');
      });

      it('should send a group information', function() {
        analytics.group('new', {
          name: 'Initech',
          industry: 'Technology',
          employees: 329,
          plan: 'enterprise',
          'total billed': 830
        });
        analytics.called(window._kmq.push, ['set', {
          'Group - name': 'Initech',
          'Group - industry': 'Technology',
          'Group - employees': 329,
          'Group - plan': 'enterprise',
          'Group - total billed': 830,
          'Group - id': 'new'
        }]);
      });
    });

    describe('ecommerce', function() {
      beforeEach(function() {
        analytics.stub(window._kmq, 'push');
        analytics.stub(window.KM, 'set');
      });

      it('should track viewed product', function() {
        analytics.track('viewed product', {
          sku: 1,
          name: 'item',
          category: 'category',
          price: 9
        });
        analytics.called(window._kmq.push, ['record', 'viewed product', {
          'viewed product - sku': 1,
          'viewed product - name': 'item',
          'viewed product - category': 'category',
          'viewed product - price': 9
        }]);
      });

      it('should track added product', function() {
        analytics.track('added product', {
          sku: 1,
          name: 'item',
          category: 'category',
          price: 9,
          quantity: 2
        });
        analytics.called(window._kmq.push, ['record', 'added product', {
          'added product - sku': 1,
          'added product - name': 'item',
          'added product - category': 'category',
          'added product - price': 9,
          'added product - quantity': 2
        }]);
      });

      it('should not prefix properties when `options.prefixProperties` is set to `false`', function() {
        kissmetrics.options.prefixProperties = false;
        analytics.track('completed order', {
          orderId: '12074d48',
          tax: 16,
          total: 166,
          products: [{
            sku: '40bcda73',
            name: 'my-product',
            price: 75,
            quantity: 1
          }, {
            sku: '64346fc6',
            name: 'other-product',
            price: 75,
            quantity: 1
          }]
        });

        analytics.assert.deepEqual(window._kmq.push.args[0][0], ['record', 'completed order', {
          orderId: '12074d48',
          tax: 16,
          total: 166
        }]);
      });

      it('should track completed order', function() {
        analytics.track('completed order', {
          orderId: '12074d48',
          tax: 16,
          total: 166,
          products: [{
            sku: '40bcda73',
            name: 'my-product',
            price: 75,
            quantity: 1
          }, {
            sku: '64346fc6',
            name: 'other-product',
            price: 75,
            quantity: 1
          }]
        }, {
          timestamp: new Date(0)
        });

        analytics.assert.deepEqual(window._kmq.push.args[0][0], ['record', 'completed order', {
          'completed order - orderId': '12074d48',
          'completed order - tax': 16,
          'completed order - total': 166
        }]);
      });

      it('should add items once KM is loaded', function() {
        analytics.track('completed order', {
          orderId: '12074d48',
          tax: 16,
          products: [{
            sku: '40bcda73',
            name: 'my-product',
            category: 'my-category',
            price: 75,
            quantity: 1
          }, {
            sku: '64346fc6',
            name: 'other-product',
            category: 'my-other-category',
            price: 75,
            quantity: 1
          }]
        }, {
          timestamp: new Date(0)
        });

        // TODO: what is happening here?
        var fn = window._kmq.push.args[1][0];
        analytics.calledTwice(window._kmq.push);
        analytics.assert(typeof fn === 'function');
        fn();

        analytics.assert.deepEqual(window.KM.set.args[0][0], {
          'completed order - category': 'my-category',
          'completed order - name': 'my-product',
          'completed order - price': 75,
          'completed order - quantity': 1,
          'completed order - sku': '40bcda73',
          _d: 1,
          _t: 0
        });

        analytics.assert.deepEqual(window.KM.set.args[1][0], {
          'completed order - category': 'my-other-category',
          'completed order - name': 'other-product',
          'completed order - price': 75,
          'completed order - quantity': 1,
          'completed order - sku': '64346fc6',
          _d: 1,
          _t: 1
        });
      });
    });
  });
});
