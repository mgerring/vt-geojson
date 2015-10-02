#!/usr/bin/env node
var path = require('path')
var concat = require('concat-stream')
var JSONStream = require('JSONStream')
var cover = require('tile-cover')
var envelope = require('turf-envelope')
var vectorTilesToGeoJSON = require('./')
var fix = require('./lib/fix')
var argv = require('minimist')(process.argv.slice(2))

if (argv._.length < 2) {
  console.log('Usage:')
  console.log('cat bounding_polygon.geojson | vt-geojson tilelive_uri minzoom [maxzoom=minzoom] [--layers=layer1,layer2,...]')
  console.log('vt-geojson tilelive_uri minx miny maxx maxy [--layers=layer1,layer2,...]')
  console.log('vt-geojson tilelive_uri tilex tiley tilez [--layers=layer1,layer2,...]')
  console.log('\ntilelive_uri can be a full tilelive uri, "path/to/file.mbtiles", or just a Mapbox map id.')
  process.exit()
}

var uri = argv._.shift()
if (!/^[^\/]*\:\/\//.test(uri)) {
  if (/mbtiles$/.test(uri)) {
    uri = 'mbtiles://' + path.resolve(uri)
  } else if (!process.env.MapboxAccessToken) {
    throw new Error('MapboxAccessToken environment variable is required for mapbox.com sources.')
  } else {
    uri = 'tilejson+http://api.mapbox.com/v4/' + uri + '.json?access_token=' + process.env.MapboxAccessToken
  }
}

var featureCollection = JSONStream.stringify(
  '{ "type": "FeatureCollection", "features": [ ',
  '\n,\n',
  '] }')

var layers = argv.layers ? argv.layers.split(',') : undefined
var tiles = argv._
if (!process.stdin.isTTY) {
  process.stdin.pipe(concat(function (data) {
    var geojson = envelope(JSON.parse(data))
    tiles = cover.tiles(geojson.geometry, {
      min_zoom: tiles[0],
      max_zoom: tiles[1] || tiles[0]
    })
    vectorTilesToGeoJSON(uri, tiles, layers)
      .pipe(fix())
      .pipe(featureCollection)
      .pipe(process.stdout)
  }))
} else {
  vectorTilesToGeoJSON(uri, tiles, layers)
    .pipe(fix())
    .pipe(featureCollection)
    .pipe(process.stdout)
}
