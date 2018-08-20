2.1.3 / 2018-07-06
==================
  * Add support for tabs, carriage returns, new lines, vertical tabs, form feeds

2.1.2 / 2017-09-28
==================

  * Bugfix: Upgrade passed-in `identify` to a version with `companyName()`

2.1.1 / 2017-09-26
==================

  * Populate Hubspot-reserved `company` from `traits.company.name`

2.1.0 / 2017-03-16
==================

  * Bump analytics.js-integration and analytics.js-integration-tester to ^3.x

2.0.1 / 2016-08-31
==================

  * fix uppercases and spaces

2.0.0 / 2016-06-21
==================

  * Remove Duo compatibility
  * Add CI setup (coverage, linting, cross-browser compatibility, etc.)
  * Update eslint configuration

1.0.9 / 2016-05-07
==================

  * Bump Analytics.js core, tester, integration to use Facade 2.x

1.0.8 / 2015-11-14
==================

  * Merge pull request #5 from segment-integrations/revert-4-traits-lowercase
  * Revert "map firstname, lastname, and jobtitle."

1.0.7 / 2015-11-13
==================

  * Merge pull request #4 from segment-integrations/traits-lowercase
  * map firstname, lastname, and jobtitle.

1.0.6 / 2015-11-10
==================

  * Add support for semantic name fields to Hubspot

1.0.5 / 2015-07-07
==================

  * Map `revenue` to `value` param in `#track` calls

1.0.4 / 2015-06-30
==================

  * Replace analytics.js dependency with analytics.js-core

1.0.3 / 2015-06-30
==================

  * Send `.event` as `.id`, `properties.id` as `_id`
    * Hubspot expects the `id` property to be the event name; any events with the `.id` property were getting messed up previously

1.0.2 / 2015-06-24
==================

  * Bump analytics.js-integration version

1.0.1 / 2015-06-24
==================

  * Bump analytics.js-integration version

1.0.0 / 2015-06-09
==================

  * Initial commit :sparkles:
