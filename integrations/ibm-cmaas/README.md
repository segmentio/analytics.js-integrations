This repo is intended to "mock" a build for IBM CMaaS.

# Context

IBM is requesting Segment builds a destination for an internal tool called CMaaS. This tool displays a “chat” type widget on the page where the following script is loaded:

```
<script src="https://www.ibm.com/common/digitaladvisor/js/cm-app.min.js"></script>
```

Beyond loading the script, Segment will also need to be able to configure the IBM Digital Data Object. This is a global JSON object which sets the “taxonomy” for the page. Specifically, it is what will determine the focus area and context around the chat. 

An example of this object looks like

```
var digitalData={product:[{productInfo:{productID:"WCM_765aad41-8e1f-4006-9829-3847062134b5",productName:"IBM Resiliency Assessment",pageName:"business-continuity-assessment"}}],page:{category:{primaryCategory:"IBM GTS - Resiliency Services"},pageInfo:{effectiveDate:"2018-03-05",expiryDate:"2017-12-18",language:"en-US",publishDate:"2018-03-05",publisher:"IBM Corporation",productTitle:"IBM Resiliency Assessment",version:"v18",contactModuleConfiguration:{contactInformationBundleKey:{focusArea:"IBM GTS - Resiliency Services",languageCode:"en",regionCode:"US"},contactModuleTranslationKey:{languageCode:"en",regionCode:"US"}},ibm:{contentDelivery:"Storefront",contentProducer:"ECM/WCM/Cloudant",country:"US",industry:"ZZ",owner:"Corporate Webmaster/New York/IBM",subject:"ZZ999",siteID:"ECOM",type:"CT502"}}}}
```

You can see the above in action on [this IBM page](https://www.ibm.com/us-en/marketplace/business-continuity-assessment).

This dynamically changes on each page, meaning, there are cases where additional information will get appended to the global digital data object.

# Mock

The test needs to be able to load the IBM CMaaS script on the page.
The test also needs to load the digitalDataObject onto the page.

The setting in Metadata will look like:

```
{
  "CMaaS": {
    "tag": [{
      "value": {
        "tagToAdd": "<script='https://www.ibm.com/common/digitaladvisor/js/cm-app.min.js'>"
      }
    }, {
      "value": {
        "tagToAdd": "<script='{product:[{productInfo:{productID:\"WCM_765aad41-8e1f-4006-9829-3847062134b5\",productName:\"IBM Resiliency Assessment\",pageName:\"business-continuity-assessment\"}}],page:{category:{primaryCategory:\"IBM GTS - Resiliency Services\"},pageInfo:{effectiveDate:\"2018-03-05\",expiryDate:\"2017-12-18\",language:\"en-US\",publishDate:\"2018-03-05\",publisher:\"IBM Corporation\",productTitle:\"IBM Resiliency Assessment\",version:\"v18\",contactModuleConfiguration:{contactInformationBundleKey:{focusArea:\"IBM GTS - Resiliency Services\",languageCode:\"en\",regionCode:\"US\"},contactModuleTranslationKey:{languageCode:\"en\",regionCode:\"US\"}},ibm:{contentDelivery:\"Storefront\",contentProducer:\"ECM/WCM/Cloudant\",country:\"US\",industry:\"ZZ\",owner:\"Corporate Webmaster/New York/IBM\",subject:\"ZZ999\",siteID:\"ECOM\",type:\"CT502\"}}}}'>"
      }
    }]
  }
}
```

# Usage

Pull in this repo locally and make changes to index.js.

To test your changes, the repo has a local copy of ajs, created via [ajs-compiler](https://github.com/segmentio/ajs-compiler).

Once you have updated ajs locally or the settings, re run the following command:

```
compile-ajs --settings=settings.json --slug=ibm-cmaas --writeKey=6vU1MkzwC2W1ikNnpxfS3itHZCvH12fq`
```

You can then update the analytics.js file in [this test repo](https://github.com/ladanazita/ladanazita.github.io/blob/master/analytics.js), commit the changes to master then navigate to ladanazita.github.io to see your changes live.


## License

Released under the [MIT license](LICENSE).
