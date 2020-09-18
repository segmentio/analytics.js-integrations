var path = require('path');
var fs = require('fs-extra');
var CompressionPlugin = require('compression-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var files = fs.readdirSync('./integrations');
var isProd = process.env.NODE_ENV === 'production';
var s3Path = 'https://ajs-next-integrations.s3-us-west-2.amazonaws.com';

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
  mode: process.env.NODE_ENV || 'development',
  output: {
    filename: isProd
      ? '[name]/[contenthash]/bundle.js'
      : '[name]/latest/bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: '[name]Integration',
    libraryTarget: 'umd',
    publicPath: isProd ? s3Path : '/'
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'dist')
  },
  optimization: {
    moduleIds: 'hashed',
    minimize: isProd
    // enable this when we figure out a better way to load common chunks

    // splitChunks: {
    // cacheGroups: {
    //   compat: {
    //     test: /[\\/]node_modules[\\/](setimmediate|component-emmitter|process|@ndhoule|is|segmentio-facade|debug|analytics-events|@segment\/analytics\.js\-integrations)[\\/]/,
    //     name: 'ajs-compat',
    //     chunks: 'all'
    //   }
    // }
    // }
  },
  plugins: [new CompressionPlugin() /* new BundleAnalyzerPlugin() */]
};
