2.5.0 / 2018-06-22
==================

  * Map productIds to content_ids param instead of product category.

2.4.2 / 2018-04-02
==================

  * allow multiple PVs (#35)

2.4.1 / 2017-08-23
==================

  * Fix typeerror for traits.gender.

2.4.0 / 2017-06-08
==================

  * Fix an issue where properties for certain spec'd fb event fields (pertaining to travel events) that contain date strings were having their dates reconformed by Facade into an incompatible format for FB's API.

2.3.0 / 2016-11-15
==================

  * Update value for Product Added and Product Viewed to take either properties.value or properties.price

2.2.1 / 2016-09-13
==================

  * fallback to USD for currency

2.2.0 / 2016-09-07
==================

  * support ecom-specv2
  * Switch from moment to dateformat

2.1.3 / 2016-08-25
==================

  * gate initialization with traits behind option

2.1.2 / 2016-08-16
==================

 * Fix for release

2.1.1 / 2016-08-16
==================

  * Merge pull request #21 from segment-integrations/update/ajs-integration
  * updating dependencies

2.1.0 / 2016-08-16
==================

  * Merge pull request #15 from segment-integrations/update/ecommerce-spec-v2
  * update ecommerce spec syntax to v2
  * Add support for advanced matching

2.0.0 / 2016-06-21
==================

  * Remove Duo compatibility
  * Add CI setup (coverage, linting, cross-browser compatibility, etc.)
  * Update eslint configuration

1.0.4 / 2016-05-07
==================

  * Bump Analytics.js core, tester, integration to use Facade 2.x

1.0.3 / 2016-04-26
==================

  * add flag to disable automatic pageview tracking

1.0.2 / 2015-12-16
==================

  * add segment agent identifier

1.0.1 / 2015-12-10
==================

  * still send old conversion pixels for mapped ecommerce events

1.0.0 / 2015-12-08
==================

  * Initial release :sparkles: — port custom audiences and conversion tracking to new pixel
