function utm(query) {
  if (query.lastIndexOf('?', 0) === 0) {
    query = query.substring(1)
  }

  query = query.replace(/\?/g, '&')

  var split = query.split('&')

  var acc = {}
  for (var i = 0; i < split.length; i++) {
    var k = split[i].split('=')[0]
    var v = split[i].split('=')[1]

    if (k.indexOf('utm_') !== -1) {
      var utmParam = k.substr(4)
      if (utmParam === 'campaign') {
        utmParam = 'name'
      }
      acc[utmParam] = v
    }
  }

  return acc
}

module.exports = utm