const { last } = require('lodash');
const zlib = require('zlib');
const fs = require('fs-extra');
const globby = require('globby');

const glob = process.cwd() + '/build/integrations/**/*.js';
const files = globby.sync(glob, `!*.map`, `!*.dynamic.js`);

const vendor = files.filter(f => f.includes('vendor') && f.endsWith('.js'));

files.forEach(file => {
  if (
    file.endsWith('dynamic.js') ||
    file.endsWith('.map') ||
    file.endsWith('.gz') ||
    file.includes('vendor')
  ) {
    return;
  }

  const libraryPath = last(file.split('build'));
  const libraryName = last(libraryPath.split('/')).replace('.js', '');
  const vendorPath = last(vendor[0].split('build'));

  const dynamic = `
window['${libraryName}Deps'] = ["${vendorPath}"]

window['${libraryName}Loader'] = function() {
  return ${fs.readFileSync(file).toString()}
}
`.trim();

  const filename = file.replace('.js', '.dynamic.js');
  fs.writeFileSync(filename + '.gz', zlib.gzipSync(dynamic));
  fs.writeFileSync(filename, dynamic);
});
