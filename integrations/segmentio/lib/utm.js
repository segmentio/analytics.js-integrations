function utm(query) {
  // Polyfills
  if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
      value: function (search, rawPos) {
        var pos = rawPos > 0 ? rawPos | 0 : 0
        return this.substring(pos, pos + search.length) === search
      }
    })
  }

  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
      'use strict'

      if (search instanceof RegExp) {
        throw TypeError('first argument must not be a RegExp')
      }
      if (start === undefined) { start = 0 }
      return this.indexOf(search, start) !== -1
    }
  }

  if (query.startsWith('?')) {
    query = query.substring(1)
  }
  query = query.replace(/\?/g, '&')

  return query.split('&').reduce((acc, str) => {
    var k = str.split('=')[0]
    var v = str.split('=')[1]

    if (k.includes('utm_')) {
      var utmParam = k.substr(4)
      if (utmParam === 'campaign') {
        utmParam = 'name'
      }
      acc[utmParam] = v
    }
    return acc
  })
}

module.exports = utm