#!/usr/bin/env node

var fs = require('fs');
var pkg = require('../package.json');
var toTemplate = require('lodash').template;

module.exports = () => {
  var template = fs.readFileSync(__dirname + '/../src/integrations.js.tpl').toString('utf8');
  var compiled = toTemplate(template);
  
  var dependencies = Object.keys(pkg.dependencies)
    .filter(name => (/^@segment\/analytics.js-integration-/).test(name))
  
  // return compiled({ integrations: dependencies.sort() })
  fs.writeFileSync(__dirname + '/../lib/integrations.js', compiled({ integrations: dependencies.sort() }))
}
