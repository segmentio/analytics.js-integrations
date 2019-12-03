const fs = require('fs')
const toTemplate = require('lodash').template

module.exports = (writekey, port) => {
  const template = fs.readFileSync(__dirname + '/../src/index.js.tpl').toString('utf8');
  const compiled = toTemplate(template);
  const host = `'http://localhost:${port}/analytics.js'`
  fs.writeFileSync(__dirname + '/../src/index.html', compiled({ host: host, writekey: writekey }))
}
