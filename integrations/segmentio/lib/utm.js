function utm(query) {
  if (query.lastIndexOf('?', 0) === 0) {
    query = query.substring(1)
  }

  query = query.replace(/\?/g, '&')

  return query.split('&').reduce(function(acc, str) {
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