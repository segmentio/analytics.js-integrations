1.0.7 / 2018-02-23
==================

  * Prep for mixed component migration

1.0.6 / 2017-11-28
==================

  * Support adding site wide widget for all `.page()` calls, meaning you can load multiple widgets on the same page 

1.0.5 / 2017-11-27
==================

  * Update bug in auto-delay config
  * Remove Criteria & Content feature for now

1.0.4 / 2017-11-22
==================

  * Update code to handle new data model from settings 

1.0.3 / 2017-10-24
==================

  * Remove default configuration options if they are empty objects to prevent widget issues 

1.0.2 / 2017-10-23
==================

  * Only noop during product tracking if `products.$.sku` is missing — not `product_id`
  * Make page name <> widget name mapping case insensitive
  * Add a few more tests to assert against these new behaviors

1.0.1 / 2017-10-04
==================

  * Modify widget parameters to look up properties for more dynamic value setting 

1.0.0 / 2017-10-04
==================

  * Initial Release :sparkles:
