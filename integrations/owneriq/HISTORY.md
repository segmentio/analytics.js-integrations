2.16.0 / 2019-03-05
===================

  * Add support for product level custom dimensions to Product List Viewed and Product List Filtered handlers

2.15.0 / 2018-08-07
===================

  * Fix casing from abmiguous docs
  * Bump version
  * Add lodash to package.json
  * Correct casing on parameter name
  * Change amp id setting name

2.15.0 / 2018-08-06
==================

  * Change amp id setting name

2.14.0 / 2018-03-28
=================

* Support position property as part of product data.

2.13.0 / 2018-02-26
=================

* Support product-level custom dimensions for enhanced ecommerce events.

2.12.0 / 2018-02-06
=================

* Support custom dimensions for enhanced ecommerce events.

2.9.6 / 2017-11-28
=================

* Add support for useGoogleAmpClientId option.

2.9.5 / 2017-10-26
=================

* Release to support reversion of failed deploy.

2.9.4 / 2017-08-31
=================

* Fix tracker naming from 2.9

2.9.3 / 2017-08-28
==================

  * Fix breaking changes in 2.9.1

2.9.2 / 2017-08-25
==================

  * Revert 2.9.0 and 2.9.1

2.9.1 / 2017-08-25
==================

  * Gate naming the GA tracker with an option

2.9.0 / 2017-24-08
==================

  * Use custom name for tracker rather than default unnamed

2.8.0 / 2017-06-13
==================

  * Extend previous change to apply for custom properties of `page` events.

2.7.0 / 2017-05-31
==================

  * Add an interface option to stop the integration from setting custom metrics/dimensions to the global GA tracker object

2.6.0 / 2017-05-10
==================

  * Sets id, when present, as a custom dimension on ga tracker object out of the box

2.5.1 / 2017-05-05
==================

  * Remove excess pageview from addImpression-bound events

2.5.0 / 2017-04-27
==================

  * Allow user to override global nonInteraction setting

2.4.1 / 2017-03-09
==================

  * Renamed 'sorters' to 'sorts' to match spec
  * Protected against non-array inputs

2.4.0 / 2017-03-07
==================

  * Add Support for addImpression action

2.3.0 / 2016-12-08
==================

  * Add Support for Optimize

2.2.0 / 2016-09-06
==================

  * support spec v2

2.1.2 / 2016-08-31
==================

  * update order started to checkout started

2.1.1 / 2016-08-16
==================

 * Fix for release

2.1.0 / 2016-08-16
==================

  * update ecommerce spec syntax to v2

2.0.0 / 2016-06-21
==================

  * Remove Duo compatibility
  * Add CI setup (coverage, linting, cross-browser compatibility, etc.)
  * Update eslint configuration

1.4.3 / 2016-05-07
==================

  * Bump Analytics.js core, tester, integration to use Facade 2.x

1.4.2 / 2016-04-28
==================

  * Changed props.category to track.category() so that it takes into account alternative casings.

1.4.1 / 2016-04-25
==================

  * add support for defensive referrer override

1.4.0 / 2016-02-13
==================

  * Merge pull request #21 from segment-integrations/add-sample-rate
  * Added non default sampleRate.
  * Added sampleRate.
  * Release 1.3.2
  * Merge pull request #19 from segment-integrations/add-list-prop-EE
  * add optional list prop to EE events
  * Release 1.3.1
  * Merge pull request #18 from segment-integrations/fix/metrics
  * refactor metrics/dimension/cg decoration factor to accomodate mapping the same property to multiple fields
  * Release 1.3.0
  * Merge pull request #16 from lukebussey/master
  * Adds support for setting content groupings via tracking code. Google Analytics supports 1-5 content groupings which are set in the same manner as metrics and dimensions. E.g. `ga('set', 'contentGroup<Index Number>', '<Group Name>');` This commit adds support for setting content groupings in the same way that metrics and dimensions are set.
  * Release 1.2.0
  * Merge pull request #14 from segment-integrations/fix/single-page
  * omit location from subsequent page() calls
  * Release 1.1.2
  * Merge pull request #11 from segment-integrations/stringify-booleans
  * stringify booleans for cm
  * Release 1.1.0
  * Merge pull request #10 from segment-integrations/add-coupon-product-level
  * support enhanced eccommerce product coupon level

1.3.2 / 2016-02-03
==================

  * add optional list prop to EE events

1.3.1 / 2016-01-28
==================

  * refactor metrics/dimension/cg decoration factor to accomodate mapping the same property to multiple fields

1.3.0 / 2016-01-26
==================

  * Adds support for setting content groupings via tracking code. Google Analytics supports 1-5 content groupings which are set in the same manner as metrics and dimensions. E.g. `ga('set', 'contentGroup<Index Number>', '<Group Name>');` This commit adds support for setting content groupings in the same way that metrics and dimensions are set.

1.2.0 / 2016-01-12
==================

  * omit location from subsequent page() calls

1.1.2 / 2015-09-11
==================

  * stringify boolean custom metrics or dimensions

1.1.0 / 2015-08-19
==================

  * support enhanced eccommerce to product coupon level

1.0.5 / 2015-08-06
==================

  * Merge pull request #9 from segment-integrations/label-fix
  * add label field to GA enhanced ecommerce calls.

1.0.4 / 2015-06-30
==================

  * Replace analytics.js dependency with analytics.js-core

1.0.3 / 2015-06-30
==================

  * Replace analytics.js dependency with analytics.js-core

1.0.2 / 2015-06-24
==================

  * Bump analytics.js-integration version

1.0.1 / 2015-06-24
==================

  * Bump analytics.js-integration version

1.0.0 / 2015-06-09
==================

  * Initial commit :sparkles:
