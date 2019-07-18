
3.4.1 / 2018-04-05
==================

  * also strip colon in event name for full stack (#42)
3.4.0 / 2018-03-13
==================

  * Replace colons in event names with underscores (#41)

3.3.2 / 2017-11-15
==================

  * Add 'isInCampaignHoldback' property to track calls

3.3.1 / 2017-04-17
==================

  * Tag for new release.

3.3.0 / 2017-04-17
==================

  * Adds option `onlySendRevenueOnOrderCompleted` to send revenue only on `Order Completed` events, which will default to `true` for new users  

3.2.1 / 2017-03-23
==================

  * Round revenue values to nearest integer

3.2.0 / 2017-03-16
==================

  * Include event tags property in the Optimizely X Fullstack track call as defined by track.properties()
  * Use user traits as user attributes instead of event properties

3.1.1 / 2017-01-17
==================

  * Update Web track call to use Optimizely X new-style API call (works with Classic and X)
  * Include tags property in Web track call as defined by track.properties()

3.1.0 / 2016-12-05
==================

  * Add integration for FullStack Javascript SDK for track calls

3.0.4 / 2016-10-05
==================

  * Minor bug fix

3.0.3 / 2016-10-05
==================

  * Refactor code

3.0.2 / 2016-10-05
==================

  * Fix Section Names and Ids

3.0.1 / 2016-09-30
==================

  * Fix logic to correctly track redirect experiments

3.0.0 / 2016-09-29
==================

  * Support Classic, X, and Both versions of Optimizely
  * Support sending all types of activations (conditional, manual, immediate) to Segment

2.0.0 / 2016-06-21
==================

  * Remove Duo compatibility
  * Add CI setup (coverage, linting, cross-browser compatibility, etc.)
  * Update eslint configuration

1.1.9 / 2016-05-07
==================

  * Bump Analytics.js core, tester, integration to use Facade 2.x

1.1.8 / 2016-04-19
==================

  * Remove value and total tests
  * Remove mapping of value to revenue

1.1.7 / 2016-04-08
==================

  * Improve tests and fix integration flag bug

1.1.6 / 2016-03-31
==================

  * Implementing a method to track integration usage

1.1.5 / 2016-03-23
==================

  * Removed ID call

1.1.4 / 2016-02-24
==================

  * fix undefined bug

1.1.3 / 2016-02-23
==================

  * support manual/custom activations aka redirect exp

1.1.2 / 2015-10-21
==================

  * Send userId to Optimizely

1.1.1 / 2015-10-13
==================

  * adding support for multivariate experiments closes #2

1.1.0 / 2015-09-08
==================

  * update properties on trackEvent and add revenue fallback
  * add nonInteraction flag for roots/listen event

1.0.4 / 2015-06-30
==================

  * Replace analytics.js dependency with analytics.js-core

1.0.3 / 2015-06-24
==================

  * Bump analytics.js-integration version

1.0.2 / 2015-06-24
==================

  * Bump analytics.js-integration version

1.0.1 / 2015-06-10
==================

  * Bump dependency versions

1.0.0 / 2015-06-09
==================

  * Initial commit :sparkles:
