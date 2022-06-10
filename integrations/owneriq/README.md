# analytics.js-integration-owneriq [![Build Status][ci-badge]][ci-link]

OwnerIQ Pixel integration for [Analytics.js][].

# Quick Start

A typical/minimal owneriq page tracking would be like:

    <!-- OwnerIQ Analytics tag --> 
    <!-- Company Name - Website Analytics Tag --> 
    <script type="text/javascript"> 
    window._oiqq = window._oiqq || []; 
    _oiqq.push(['oiq_addPageLifecycle', '{tag_id}']); 
    _oiqq.push(['oiq_doTag']); 
    (function() { 
    var oiq = document.createElement('script'); oiq.type = 'text/javascript'; oiq.async = true; 
    oiq.src = document.location.protocol + '//px.owneriq.net/stas/s/{data_group_id}.js'; 
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(oiq, s); 
    })(); 
    </script> 
    <!-- End OwnerIQ tag --> 

A analytics page view tracking equivalent would be like:

    <script>
    // somewhat loader to make sure the analytics instance is available
    analytics.initialize();
    analytics.page();
    </script>

A typical/minimal owneriq conversion tracking would be like:

    <!-- OwnerIQ Conversion tag --> 
    <!-- Company Name - Sale Purchase Tag --> 
    <script type="text/javascript"> 
    var _oiq_lifecycle = '{tag_id}'; window._oiqq = window._oiqq || []; 
    _oiqq.push(['oiq_addPageLifecycle', _oiq_lifecycle]); 
    _oiqq.push(["oiq_addCustomKVP",["brand_1","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["cc_type","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["cust1","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["customer_id","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["customer_type","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["customer_value","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["google_product_category_1","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["gtin_1","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["id_1","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["mpn_1","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["order_id","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["price_1","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["product_type_1","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["quantity_1","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["title_1","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["total_cost_notax","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["total_cost_tax","value"]]); 
    _oiqq.push(["oiq_addCustomKVP",["total_quantity","value"]]); 
    _oiqq.push(['oiq_doTag']); 
    (function() { 
    var oiq = document.createElement('script'); oiq.type = 'text/javascript'; oiq.async = true; 
    oiq.src = 'https://px.owneriq.net/stas/s/{data_group_id}.js'; 
    var oiq_doctitle = 'Default Conversion - do not edit'; 
    if (typeof document != 'undefined' && document){ if(document.title!=null && document.title!='') 
    {oiq_doctitle = document.title; } 
    } 
    var oiq_conv = document.createElement('script'); oiq_conv.type = 'text/javascript'; oiq_conv.async = true; 
    oiq_conv.src = 'https://px.owneriq.net/j?pt={data_group_id}&s='+_oiq_lifecycle+'&sConvTitle='+oiq_doctitle+'&cnv=true'; 
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(oiq, s); 
    s.parentNode.insertBefore(oiq_conv, s); 
    })(); 
    </script> 
    <!-- End OwnerIQ tag --> 
    
A analytics conversion tracking equivalent would be like:

    <script>
    // somewhat loader to make sure the analytics instance is available
    analytics.init(settings);
    analytics.track('Order Completed', {
      checkout_id: 'fksdjfsdjfisjf9sdfjsd9f',
      order_id: '50314b8e9bcf000000000000',
      affiliation: 'Google Store',
      total: 27.50,
      revenue: 25.00,
      shipping: 3,
      tax: 2,
      discount: 2.5,
      coupon: 'hasbros',
      currency: 'USD',
      products: [
        {
          product_id: '507f1f77bcf86cd799439011',
          sku: '45790-32',
          name: 'Monopoly: 3rd Edition',
          price: 19,
          quantity: 1,
          category: 'Games',
          url: 'https://www.example.com/product/path',
          image_url: 'https:///www.example.com/product/path.jpg'
        },
        {
          product_id: '505bd76785ebb509fc183733',
          sku: '46493-32',
          name: 'Uno Card Game',
          price: 3,
          quantity: 2,
          category: 'Games'
        }
      ]
    });
    </script>


## License

Released under the [MIT license](LICENSE).


[Analytics.js]: https://segment.com/docs/libraries/analytics.js/
[ci-link]: https://circleci.com/gh/segment-integrations/analytics.js-integration-google-analytics
[ci-badge]: https://circleci.com/gh/segment-integrations/analytics.js-integration-google-analytics.svg?style=svg
