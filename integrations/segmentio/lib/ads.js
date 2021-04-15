function ads(query) {
  var queryIds = {
    btid: 'dataxu',
    urid: 'millennial-media',
  }

  if (query.lastIndexOf('?', 0) === 0) {
    query = query.substring(1)
  }

  query = query.replace(/\?/g, '&')

  var parts = query.split('&')

  for (var i = 0; i < parts.length; i++) {
    var k = parts[i].split('=')[0]
    var v = parts[i].split('=')[1]

    if (queryIds[k]) {
      return {
        id: v,
        type: queryIds[k],
      }
    }
  }
}

module.exports = ads