'use strict';

const Analytics = require('@segment/analytics.js-core').constructor;
const integration = require('@segment/analytics.js-integration');
const sandbox = require('@segment/clear-env');
const tester = require('@segment/analytics.js-integration-tester');
const Retentive = require('../lib/index.js');

describe('Retentive', () => {
  let analytics;
  let retentive;

  beforeEach(() => {
    analytics = new Analytics();
    retentive = new Retentive({
      workspaceId: '<workspace-id>'
    });
    analytics.use(Retentive);
    analytics.use(tester);
    analytics.add(retentive);
  });

  afterEach(() => {
    analytics.restore();
    analytics.reset();
    retentive.reset();
    sandbox();
  });

  it('should have the right settings', () => {
    analytics.compare(
      Retentive,
      integration('Retentive')
        .readyOnInitialize()
        .readyOnLoad()
        .global('retentive')
        .option('workspaceId', null)
    );
  });

  describe('before loading', () => {
    beforeEach(() => {
      analytics.stub(retentive, 'load');
    });

    describe('#initialize', () => {
      it('should create window.retentive', () => {
        delete window.retentive;
        analytics.initialize({
          Retentive: {
            workspaceId: '<workspace-id>'
          }
        });
        analytics.assert(window.retentive);
      });

      it('should call #load', () => {
        analytics.initialize();
        analytics.called(retentive.load);
      });

      it('should validate workspaceId', () => {
        let err;
        try {
          new Retentive().initialize();
        } catch (e) {
          err = e;
        }
        analytics.assert.equal(
          err.message,
          'Retentive workspaceId is required'
        );
      });
    });

    describe('#loaded', () => {
      it('should check window.retentive', () => {
        delete window.retentive;

        analytics.assert(!retentive.loaded());
        analytics.initialize({
          Retentive: {
            workspaceId: '<workspace-id>'
          }
        });
        analytics.assert(retentive.loaded());
      });
    });
  });

  describe('after loading', () => {
    beforeEach(done => {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#identify', () => {
      beforeEach(() => {
        analytics.stub(window.retentive, 'identify');
      });

      it('should ignore anonymous id', () => {
        analytics.identify();
        analytics.didNotCall(window.retentive.identify);
      });

      it('should send an id', () => {
        analytics.identify('id');
        analytics.called(window.retentive.identify, 'id');
      });

      it('should only send strings as the id', () => {
        analytics.identify(1);
        analytics.called(window.retentive.identify, '1');
      });
    });
  });
});
