const { strict } = require('assert');
var path = require('path');
var fs = require('fs-extra');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

var files = fs.readdirSync('./integrations');

var entries = {};

files.forEach(function(file) {
  var filePath = './integrations/' + file + '/lib/index.js';
  if (!fs.existsSync(filePath)) {
    filePath = './integrations/' + file + '/lib/index.ts';
    if (!fs.existsSync(filePath)) {
      return;
    }
  }
  entries[file] = filePath;
});

var plugins = [];

module.exports = {
  entry: entries,
  mode: 'development',
  devtool: 'eval-source-map',
  output: {
    filename: '[name]/latest/[name].dynamic.js.gz',
    chunkFilename: 'vendor/[name].[contenthash].js.gz',
    path: path.resolve(__dirname, 'tester/dist/next-integrations/integrations'),
    library: '[name]Integration',
    libraryTarget: 'window',
    hashFunction: "sha256"
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    ie: '11'
                  }
                }
              ]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      domify: '/node_modules/domify/index.js',
      '@segment/analytics.js-integration':
        '/node_modules/@segment/analytics.js-integration'
    }
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'build')
  },
  optimization: {
    moduleIds: 'hashed',
    minimize: false
  },
  plugins: plugins
};
