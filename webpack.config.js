'use strict';
const webpack = require('webpack'),
  path = require('path'),
  fs = require('fs');

let nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: './es6/app.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'build.js'
  },

  module: {
    loaders: [{
      loader: 'json-loader',
      test: /.json$/
    }, {
      loader: 'babel-loader',
      test: /.js$/,
      query: {
        presets: ['es2015', 'stage-0'],
      }
    }]
  },
  externals: nodeModules,
  plugins: [
        new webpack.IgnorePlugin(/\.(css|less)$/),
        new webpack.BannerPlugin(
      'require("source-map-support").install();', {
        raw: true,
        entryOnly: false
      })
  ],
  devtool: 'sourcemap'
}
