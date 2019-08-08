'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Tracktor = require('../lib/');

describe('Tracktor', function() {
  var analytics;
  var tracktor;
  var options = {
    workspaceId: 'a-workspace-id',
    sourceId: 'a-source-id'
  };

  beforeEach(function() {
    analytics = new Analytics();
    tracktor = new Tracktor(options);
    analytics.use(Tracktor);
    analytics.use(tester);
    analytics.add(tracktor);
  });

  afterEach(function(done) {
    analytics.restore();
    analytics.reset();
    tracktor.reset();
    sandbox();
    done();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Tracktor,
      integration('Tracktor')
        .global('Tracktor')
        .option('sourceId', 'a-source-id')
        .option('workspaceId', 'a-workspace-id')
    );
  });
});
