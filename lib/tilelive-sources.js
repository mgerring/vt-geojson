var tilelive = require('tilelive')
require('tilejson').registerProtocols(tilelive)
require('@mapbox/mbtiles').registerProtocols(tilelive)

module.exports = function (uri, callback) {
  tilelive.auto(uri)
  return tilelive.load(uri, callback)
}

module.exports.tilelive = tilelive

// for conditionally testing in node/browser
module.exports.mbtiles = true
