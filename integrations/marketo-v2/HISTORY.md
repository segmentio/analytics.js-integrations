4.0.0 / 2021-09-09
=================

  * Deprecate associateLead method
  * Remove email hash method
  * Add support for Marketo forms
  * Add support for marketoFormId and marketoHostUrl settings

3.0.7 / 2018-02-23
==================

  * Prep for mixed component migration

3.0.6 / 2017-07-27
==================

  * Update date of birth API name

3.0.5 / 2017-07-06
==================

  * Remove api mapping file and put into index.js

3.0.4 / 2017-07-06
==================

  * Update traits to use SOAP API names

3.0.3 / 2017-06-26
==================

  * Update marketo-hash-app endpoint

3.0.2 / 2017-06-26
==================

  * Add Marketo enabled check

3.0.1 / 2017-06-13
==================

  * Fix name so it matches metadata

3.0.0 / 2017-06-08
==================

  * Update identify calls to use REST API names and only send custom traits if users specific them in their settings
    to have parity with the server side integration.
  * Remove track call hack since our server side integration no longer uses the hack and properly supports track calls.

2.0.1 / 2016-07-12
==================

  * add userId to traits
  * Update Karma to 1.1.0

2.0.0 / 2016-06-21
==================

  * Remove Duo compatibility
  * Add CI setup (coverage, linting, cross-browser compatibility, etc.)
  * Update eslint configuration

1.0.5 / 2016-05-07
==================

  * Bump Analytics.js core, tester, integration to use Facade 2.x

1.0.4 / 2016-01-13
==================

  * pass asyncOnly config flag at initialization

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
