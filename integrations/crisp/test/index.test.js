'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var tester = require('@segment/analytics.js-integration-tester');
var Crisp = require('../lib/');
var sandbox = require('@segment/clear-env');

describe('Crisp', function() {
	var analytics;
	var options;
	var crisp;

	beforeEach(function() {
		options = {
			websiteId: '7598bf86-9ebb-46bc-8c61-be8929bbf93d',
			listen: true
		};

		analytics = new Analytics();
		crisp = new Crisp(options);
		analytics.use(Crisp);
		analytics.use(tester);
		analytics.add(crisp);
	});

	afterEach(function() {
		analytics.restore();
		analytics.reset();
		crisp.reset();
		sandbox();
	});

	it('should have the correct settings', function() {
		analytics.compare(
			Crisp,
			integration('Crisp')
				.global('$crisp')
				.option('websiteId', '')
				.readyOnLoad()
		);
	});

	describe('#initialize', function() {
		beforeEach(function() {
			analytics.stub(crisp, 'load');
		});

		it('should call #load', function() {
			analytics.didNotCall(crisp.load);
			crisp.initialize();
			analytics.calledOnce(crisp.load);
		});
	});

	describe('#loaded', function() {
		it('should return `false` when Crisp is not loaded', function() {
			analytics.assert(crisp.loaded() === false);
		});

		it('should return `true` when Crisp is loaded', function() {
			window.$crisp = [];
			window.$crisp.is = function() { };
			analytics.assert(crisp.loaded() === true);
		});
	});

	xdescribe('before loading', function() {
		beforeEach(function() {
			analytics.stub(crisp, 'load');
		});
	});

	describe('after loading', function() {
		describe('#load', function(done) {
			beforeEach(function() {
				analytics.stub(crisp, 'load');
			});

			it('should initialize `window.$crisp`', function() {
				analytics.assert(typeof window.$crisp === 'undefined');

				crisp.load(function() {
					analytics.assert(typeof window.$crisp !== 'undefined');
					done();
				});
			});
		});

		describe('#identify', function() {
			beforeEach(function(done) {
				analytics.once('ready', done);

				analytics.initialize();
			});

			it('should set user properties', function() {
				var attrs = {
					name: 'Bob Loblaw',
					email: 'bob.loblaw@test.com',
					phone: '555-555-5555'
				};
				analytics.identify('user-id', attrs);
			});

			it('should fall back on `firstName` if `lastName` or `name` are not specified', function() {
				var attrs = {
					firstName: 'Bob',
					email: 'bob.loblaw@test.com'
				};
				analytics.identify('user-id', attrs);
			});
		});
	});
});