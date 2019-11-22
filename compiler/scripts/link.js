const { spawnSync } = require('child_process')

/**
 * Link an npm package globally or locally.
 * If local, pass the package name as the second parameter.
 * @param {String} path 
 * @param {String} package (optional)
 */
exports.link = (path, package = '') => {
  spawnSync('yarn link', [package], {
    shell: true,
    cwd: path,
    stdio: 'inherit'
  })  
}

exports.unlink = (path, package = '') => {
  spawnSync('yarn unlink', [package], {
    shell: true,
    cwd: path,
    stdio: 'inherit'
  })  
}