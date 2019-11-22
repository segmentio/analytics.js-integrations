#!/usr/bin/env node

var fs = require('fs');
var pkg = require('../package.json');
var toTemplate = require('lodash').template;

module.exports = (slug) => {
  var template = fs.readFileSync(__dirname + '/../src/integrations.js.tpl').toString('utf8');
  var compiled = toTemplate(template);
  
  var dependencies = Object.keys(pkg.dependencies)
    .filter(name => (/^@segment\/analytics.js-integration-/).test(name))
  
  dependencies.push(`@segment/analytics.js-integration-${slug}`)
  
  fs.writeFileSync(__dirname + '/../lib/integrations.js', compiled({ integrations: dependencies.sort() }))
}
