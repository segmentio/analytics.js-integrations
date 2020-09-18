var path = require('path');
var fs = require('fs-extra');
var TerserPlugin = require('terser-webpack-plugin');
var CompressionPlugin = require('compression-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var files = fs.readdirSync('./integrations');

var entries = {};

files.forEach(function(file) {
  var filePath = './integrations/' + file + '/lib/index.js';
  if (!fs.existsSync(filePath)) {
    return;
  }
  entries[file] = filePath;
});

module.exports = {
  entry: entries,
  mode: process.env.NODE_ENV || 'production',
  // devtool: 'inline-source-map',
  output: {
    filename: '[name]/[contenthash]/bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: '[name]Integration',
    libraryTarget: 'umd'
  },
  optimization: {
    moduleIds: 'hashed',
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false
          }
        },
        cache: true,
        parallel: true,
        extractComments: false
      })
    ],

    splitChunks: {
      cacheGroups: {
        compat: {
          test: /[\\/]node_modules[\\/](setimmediate|component-emmitter|process|@ndhoule|is|segmentio-facade|debug|analytics-events|@segment\/analytics\.js\-integrations)[\\/]/,
          name: 'ajs-compat',
          chunks: 'all'
        }
      }
    }
  },
  plugins: [new CompressionPlugin() /* new BundleAnalyzerPlugin() */]
};
