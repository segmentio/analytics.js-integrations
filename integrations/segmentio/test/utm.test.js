var assert = require('proclaim');
var utm = require('../lib/utm')

describe('utm', function() {
  it('parses utm params', function() {
    var url = 'https://localhost:3000/?utm_foo=bar'
    var utmParams = utm(url)

    assert.deepEqual(utmParams, { foo: 'bar' })
  })

  it('parses multiple utm params', function() {
    var url = 'https://localhost:3000/?utm_foo=bar&utm_baz=bang'
    var utmParams = utm(url)

    assert.deepEqual(utmParams, { foo: 'bar', baz: 'bang' })
  })

  it('renames campaign param', function() {
    var url = 'https://localhost:3000/?utm_campaign=bar'
    var utmParams = utm(url)

    assert.deepEqual(utmParams, { name: 'bar' })
  })

  it('only parses utm params', function() {
    var url = 'https://localhost:3000/?utm_foo=bar&baz=bang'
    var utmParams = utm(url)

    assert.deepEqual(utmParams, { foo: 'bar' })
  })

  it('only parses params prefixed with utm_', function() {
    var url = 'https://localhost:3000/?utm=bang'
    var utmParams = utm(url)

    assert.deepEqual(utmParams, {})
  })

  it('guards against undefined values', function() {
    var url = 'https://localhost:3000/?utm_foo'
    var utmParams = utm(url)

    assert.deepEqual(utmParams, { foo: '' })
  })

  it('guards against empty values', function() {
    var url = 'https://localhost:3000/?utm_foo='
    var utmParams = utm(url)

    assert.deepEqual(utmParams, { foo: '' })
  })

  it('guards against missing keys', function() {
    var url = 'https://localhost:3000/?utm_'
    var utmParams = utm(url)

    assert.deepEqual(utmParams, {})
  })
})