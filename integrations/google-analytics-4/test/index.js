'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var GA4 = require('../lib/');

// gtag.js saves arrays as argument objects and assert.deepEquals fails when comparing
// argument objects against arrays.
var toArray = require('to-array');

describe('Google Analytics 4', function () {
    var analytics;
    var ga4;

    var settings = {
        measurementIds: ['G-100', 'G-200']
    };

    beforeEach(function () {
        analytics = new Analytics();
        ga4 = new GA4(settings);
        analytics.use(GA4);
        analytics.use(tester);
        analytics.add(ga4);
    });

    afterEach(function () {
        analytics.restore();
        analytics.reset();
        ga4.reset();
        sandbox();
    });

    it('should have the right settings', function () {
        analytics.compare(
            GA4,
            integration('Google Analytics 4')
                .global('gtag')
                .global('ga4DataLayer')
                .option('measurementIds', [])
                .option('cookieDomainName', 'auto')
                .option('cookiePrefix', '_ga')
                .option('cookieExpiration', 63072000)
                .option('cookieUpdate', true)
                .option('cookieFlags', '')
                .option('sendAutomaticPageViewEvent', false)
                .option('allowAllAdvertisingFeatures', false)
                .option('allowAdvertisingPersonalization', false)
                .option('disableGoogleAnalytics', false)
                .option('googleReportingIdentity', 'device')
                .option('userProperties', {})
                .option('customEventsAndParameters', [])
        );
    });

    describe('loading', function () {
        beforeEach(function () {
            analytics.spy(ga4, 'load');
        });

        it('should load', function (done) {
            analytics.load(ga4, done);
        });

        describe('#initialize', function () {
            it('should create window.ga4DataLayer', function () {
                analytics.assert(!window.ga4DataLayer);
                analytics.initialize();
                analytics.assert(typeof window.ga4DataLayer === 'object');
            });

            it('should create window.gtag', function () {
                analytics.assert(!window.gtag);
                analytics.initialize();
                analytics.assert(typeof window.gtag === 'function');
            });

            it('should not initialize when measurement IDs is empty', function () {
                ga4.options.measurementIds = [];

                analytics.initialize();
                analytics.didNotCall(ga4.load)
            });

            it('should not initialize when Disable Google Analytics is set to true', function () {
                ga4.options.disableGoogleAnalytics = true;

                analytics.initialize();
                analytics.didNotCall(ga4.load)
            });

            it('should load gtag.js with the first measurement ID', function () {
                analytics.initialize();
                analytics.called(ga4.load)
                analytics.loaded('<script src="http://www.googletagmanager.com/gtag/js?id=G-100&l=ga4DataLayer"></script>')
            });
        });
    });

    describe('configuring', function () {
        beforeEach(function () {
            // Avoid loading gtag.js so it doesn't process commands sent to
            // the data layer before we can assert their values.
            analytics.stub(ga4, 'load', function (args, callback) {
                callback();
            });
        });

        it('should configure all measurement IDs', function () {
            analytics.initialize();
            analytics.equal(toArray(window.ga4DataLayer)[1][0], 'config')
            analytics.equal(toArray(window.ga4DataLayer)[1][1], 'G-100')
            analytics.equal(toArray(window.ga4DataLayer)[2][0], 'config')
            analytics.equal(toArray(window.ga4DataLayer)[2][1], 'G-200')
        });

        it('should disable automatic page view measurement for all measurement IDs', function () {
            ga4.options.sendAutomaticPageViewEvent = false;
            analytics.initialize();

            analytics.equal(window.ga4DataLayer[1][2]['send_page_view'], false)
            analytics.equal(window.ga4DataLayer[2][2]['send_page_view'], false)
        });

        it('should set cookie related setting for all measurement IDs', function () {
            ga4.options.cookieUpdate = false;
            ga4.options.cookieDomainName = 'ajs.test'
            ga4.options.cookiePrefix = 'test_prefix'
            ga4.options.cookieExpiration = 21
            ga4.options.cookieFlags = 'SameSite=None;Secure'
            analytics.initialize();

            analytics.equal(window.ga4DataLayer[1][2]['cookie_update'], false)
            analytics.equal(window.ga4DataLayer[2][2]['cookie_update'], false)

            analytics.equal(window.ga4DataLayer[1][2]['cookie_domain'], 'ajs.test')
            analytics.equal(window.ga4DataLayer[2][2]['cookie_domain'], 'ajs.test')

            analytics.equal(window.ga4DataLayer[1][2]['cookie_prefix'], 'test_prefix')
            analytics.equal(window.ga4DataLayer[2][2]['cookie_prefix'], 'test_prefix')

            analytics.equal(window.ga4DataLayer[1][2]['cookie_expires'], 21)
            analytics.equal(window.ga4DataLayer[2][2]['cookie_expires'], 21)

            // cookie_flags uses the `set` command
            analytics.equal(window.ga4DataLayer[3][0], 'set')
            analytics.equal(window.ga4DataLayer[3][1]['cookie_flags'], 'SameSite=None;Secure')

        });

        it('should disable all advertising features', function () {
            ga4.options.allowAllAdvertisingFeatures = false;
            analytics.initialize();
            analytics.deepEqual(toArray(window.ga4DataLayer[4]), ['set', 'allow_google_signals', false])
        });

        it('should disable all advertising features', function () {
            ga4.options.allowAdvertisingPersonalization = false;
            analytics.initialize();
            analytics.deepEqual(toArray(window.ga4DataLayer[5]), ['set', 'allow_ad_personalization_signals', false])
        });
    });

    describe('after loading', function () {
        beforeEach(function (done) {
            analytics.once('ready', done);
            analytics.initialize();
        });

        describe('#identify', function () {
            beforeEach(function () {
                analytics.stub(window, 'gtag');
            });

            it('should map configured user properties', function () {
                ga4.options.userProperties = {
                    'traits.role': 'role',
                    'traits.tz': 'timezone'
                }
                analytics.identify('user1', {
                    role: 'tester',
                    tz: 'TST'
                });
                analytics.called(window.gtag, 'set', 'user_properties', {
                    role: 'tester',
                    timezone: 'TST'
                });
            })

            it('should map the user ID', function () {
                ga4.options.googleReportingIdentity = 'userIdAndDevice'
                analytics.identify('user1');
                analytics.called(window.gtag, 'set', 'user_properties', {
                    user_id: 'user1'
                });
            })
        });

        describe('#group', function () {
            beforeEach(function () {
                analytics.stub(window, 'gtag');
            });

            it('should send join_group event with group_id', function() {
                analytics.group('group1');
                analytics.called(window.gtag, 'event', 'join_group', {
                    group_id: 'group1'
                });
            })
        });

        describe('#page', function () {
            beforeEach(function () {
                analytics.stub(window, 'gtag');
            });

            it('should send a page_view event with properties', function() {
                analytics.page('Home', { url: 'url', path: '/path', referrer: 'http://ajs.test' });
                analytics.called(window.gtag, 'event', 'page_view', {
                  page_location: 'url',
                  page_referrer: 'http://ajs.test',
                  page_title: 'Home'
                });
              });

            it('should not send events when disablePageViewMeasurement is disabled', function() {
                ga4.options.sendAutomaticPageViewEvent = true
                analytics.page('Home');
                analytics.didNotCall(window.gtag, 'event', 'page_view')
            });
        });

        describe('#track', function () {
            beforeEach(function () {
                analytics.stub(window, 'gtag');
            });

            it('should ignore invalid custom event and parameter configs', function() {
                ga4.options.customEventsAndParameters = [
                    {
                        segmentEvent: '',
                        googleEvent: 'gevent',
                        parameters: []
                    },
                    {
                        segmentEvent: 'event1',
                        googleEvent: '',
                        parameters: []
                    }
                ]

                analytics.track('event1')
                analytics.didNotCall(window.gtag, 'event')

            });

            it('should map custom events and parameters', function() {
                ga4.options.customEventsAndParameters = [
                    {
                        segmentEvent: 'event1',
                        googleEvent: 'gevent',
                        parameters: [{
                            key: 'properties.state',
                            value: 'state'
                        }]
                    }
                ]

                analytics.track('event1', {
                    state: 'playing'
                })
                analytics.called(window.gtag, 'event', 'gevent', {
                    state: 'playing'
                })
            });

            it('should ignore invalid parameters', function() {
                ga4.options.customEventsAndParameters = [
                    {
                        segmentEvent: 'event1',
                        googleEvent: 'gevent',
                        parameters: [{
                            key: '',
                            value: 'state'
                        }]
                    },
                    {
                        segmentEvent: 'event1',
                        googleEvent: 'gevent',
                        parameters: [{
                            key: 'properties.state',
                            value: ''
                        }]
                    },
                    {
                        segmentEvent: 'event1',
                        googleEvent: 'gevent',
                        parameters: {
                            'invalid': 'mapping'
                        }
                    }
                ]

                analytics.track('event1', {
                    state: 'playing'
                })
                analytics.calledTwice(window.gtag, 'event', 'gevent')
            });
        });
    })
});
