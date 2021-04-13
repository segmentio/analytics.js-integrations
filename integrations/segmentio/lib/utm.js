function utm(query) {
  // Polyfills
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(search, rawPos) {
      var pos = rawPos > 0 ? rawPos | 0 : 0
      return this.substring(pos, pos + search.length) === search
    }
  }

  if (query.startsWith('?')) {
    query = query.substring(1)
  }
  query = query.replace(/\?/g, '&')

  return query.split('&').reduce((acc, str) => {
    var k = str.split('=')[0]
    var v = str.split('=')[1]

    if (k.indexOf('utm_') !== -1) {
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