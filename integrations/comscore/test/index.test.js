'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Comscore = require('../lib/');

describe('comScore', function() {
  var analytics;
  var comscore;
  var options = {
    c2: 'x',
    comscorekw: 'test',
    autoUpdateInterval: '',
    beaconParamMap: {
      exampleParam: 'c5',
      anotherParam: 'c6'
    },
    consentFlag: ''
  };

  beforeEach(function() {
    analytics = new Analytics();
    comscore = new Comscore(options);
    analytics.use(Comscore);
    analytics.use(tester);
    analytics.add(comscore);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    comscore.reset();
    sandbox();
  });

  it('should have the right settings', function() {
    analytics.compare(
      Comscore,
      integration('comScore')
        .global('_comscore')
        .option('c1', '2')
        .option('c2', '')
        .option('comscorekw', '')
        .option('consentFlag', '')
    );
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(comscore, 'load');
    });

    describe('#initialize', function() {
      it('should create window._comscore', function() {
        analytics.assert(!window._comscore);
        analytics.initialize();
        analytics.page();
        analytics.assert(window._comscore instanceof Array);
      });

      it('should push values if window._comscore already exists', function() {
        window._comscore = ['test value'];
        analytics.initialize();
        analytics.page('testing', { exampleParam: 'testing' });
        analytics.assert(window._comscore instanceof Array);
        analytics.assert(window._comscore, [
          'test value',
          { c5: 'testing', c1: '2', c2: 'x', comscorekw: 'test' }
        ]);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      comscore.options.c2 = '24186693';
      analytics.load(comscore, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      comscore.options.c2 = '24186693';
      analytics.once('ready', done);
      analytics.initialize();
      analytics.page();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window.COMSCORE, 'beacon');
      });

      it('should call only on 2nd page', function() {
        analytics.didNotCall(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          comscorekw: 'test'
        });
        analytics.page();
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          comscorekw: 'test'
        });
      });

      it('should map properties in beaconParamMap', function() {
        analytics.didNotCall(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          comscorekw: 'test'
        });
        analytics.page({ exampleParam: 'foo', anotherParam: 'bar' });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test'
        });
      });
      it('should omit cs_ucfr flag when consentFlag option is not mapped in the settings', function() {
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: 'value'
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test'
        });
      });
      it('should omit cs_ucfr when mapped attribite is not in the payload', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar'
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test'
        });
      });
      it('should set cs_ucfr to "" (empty string) when mapped property is not 1/0, true/false', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: 'some value'
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: ''
        });
      });
      it('should omit cs_ucfr when mapped property is null', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: null
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test'
        });
      });
      it('should set cs_ucfr to "1" string when mapped property is true (bool)', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: true
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '1'
        });
      });
      it('should set cs_ucfr to "1" string when mapped property is true (string)', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: 'true'
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '1'
        });
      });
      it('should set cs_ucfr to "1" string when mapped property is 1 (int)', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: 1
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '1'
        });
      });
      it('should set cs_ucfr to "1" string when mapped property is "1" (string)', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: '1'
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '1'
        });
      });
      it('should set cs_ucfr to "0" string when mapped property is false (bool)', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: false
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '0'
        });
      });
      it('should set cs_ucfr to "0" string when mapped property is "false" (string)', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: 'false'
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '0'
        });
      });
      it('should set cs_ucfr to "0" string when mapped property is 0 (int)', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: 0
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '0'
        });
      });
      it('should set cs_ucfr to "0" string when mapped property is "0" (string)', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: '0'
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '0'
        });
      });
      it('should set cs_ucfr to "1" string when the 3rd character in US privacy string is "N"', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: '1YNY'
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '1'
        });
      });
      it('should set cs_ucfr to "0" string when the 3rd character in US privacy string is "Y"', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: '1YYY'
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '0'
        });
      });
      it('should omit cs_ucfr when the 3rd character in US privacy string is "-"', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: '1Y-Y'
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test'
        });
      });
      it('should check if mapped attribute is available in the properties object', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          flagParam: '1'
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '1'
        });
      });
      it('should map cs_ucfr to the nested properties', function() {
        comscore.options.consentFlag = 'prop.flagParam';
        analytics.page({
          exampleParam: 'foo',
          anotherParam: 'bar',
          prop: { flagParam: '1' }
        });
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '1'
        });
      });
      it('should map cs_ucfr to the context attribute when mapped property is not available', function() {
        comscore.options.consentFlag = 'flagParam';
        analytics.page(
          {
            exampleParam: 'foo',
            anotherParam: 'bar'
          },
          {
            flagParam: '1'
          }
        );
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '1'
        });
      });
      it('should map nested objects in the context', function() {
        comscore.options.consentFlag = 'traits.flagParam';
        analytics.page(
          {
            exampleParam: 'foo',
            anotherParam: 'bar'
          },
          {
            traits: { flagParam: '1' }
          }
        );
        analytics.called(window.COMSCORE.beacon, {
          c1: '2',
          c2: '24186693',
          c5: 'foo',
          c6: 'bar',
          comscorekw: 'test',
          cs_ucfr: '1'
        });
      });
    });
  });
});
