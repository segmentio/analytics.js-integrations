'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var TagInjector = require('../lib/');

describe('Tag Injector', function() {
  var analytics;
  var tagInjector;
  var options = {
    tags: [
      {
        tagKind: 'url',
        tagValue:
          'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js'
      },
      {
        tagKind: 'variable',
        tagValue: '{ a: { b: { c: 1 } }, aa: 1, aaa: 1 }',
        variableName: '__y'
      },
      {
        tagKind: 'variable',
        tagValue: '{ a: { b: { cc: 2 } }, aa: 2 }',
        variableName: '__y'
      }
    ]
  };

  beforeEach(function() {
    analytics = new Analytics();
    tagInjector = new TagInjector(options);
    analytics.use(TagInjector);
    analytics.use(integrationTester);
    analytics.add(tagInjector);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    tagInjector.reset();
    sandbox();
  });

  it('should have the correct options', function() {
    analytics.compare(
      TagInjector,
      integration('Tag Injector').option('tags', [])
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(tagInjector, 'ready');
    });

    describe('#initialize', function() {
      it('should call ready', function() {
        analytics.initialize();
        analytics.called(tagInjector.ready);
      });

      it('should add a script tag for `url` tags', function() {
        analytics.initialize();
        analytics.notEqual(
          null,
          document.querySelector(
            'script[src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.js"][data-injected-by="segment"]'
          )
        );
      });

      it('should deep-merge variables for `variable` tags', function() {
        analytics.initialize();
        analytics.deepEqual(
          { a: { b: { c: 1, cc: 2 } }, aa: 2, aaa: 1 },
          window.__y
        );
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(tagInjector, done);
    });
  });
});
