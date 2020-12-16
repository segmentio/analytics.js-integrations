2.11.3 / 2020-12-14
===================

  * Bump segmentio-facade to ^3.2.7

2.11.2/ 2020-07-28
==================

  * Explicitly not enable Limited Data Use (LDU) mode in the FB Pixel SDK when the Limited Data Use Segment setting is disabled.

2.11.1/ 2020-07-22
==================

  * Add support to override the Data Processing Options by pass them in the load options object.
  ```
  analytics.load("<writeKey>", {
    integrations: {
      'Facebook Pixel': {
        dataProcessingOptions: [['LDU'], 1, 1000]
      }
    }
  });
  ```

2.11.0/ 2020-07-16
==================

  * Add support for Limited Data Use. See: https://developers.facebook.com/docs/marketing-apis/data-processing-options

2.10.0/ 2019-12-04
==================

  * Use userId or anonyousId as external_id if not present in traits, user needs to enable new setting "userIdAsExternalId" needs to set to "true" which defaults to "false". Also setting "keyForExternalId" has high preference above this setting.

2.9.0/ 2019-10-23
==================

  * Added support for user traits passed in snake case .

2.8.1/ 2019-09-25
==================

  * Add missing properties for facebook pixel standard events.

2.7.0/ 2019-06-10
==================

  * Add support for a custom property blacklist setting

2.6.0/ 2019-03-08
==================

  * Adds message deduping for use with server-side component

2.5.4/ 2018-09-13
==================

  * Adds Search and InitiateCheckout event support

2.5.2/ 2018-09-13
==================

  * Fixes the wrong content type for Order Completed

2.5.1 / 2018-09-10
==================

  * Makes content type customizable for Product List Viewed, Product Viewed, Product Added, and
  Order Completed events.
  * Adds a setting to disable Automatic Configuration.

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
