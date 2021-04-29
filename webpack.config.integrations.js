var path = require('path');
var fs = require('fs-extra');
var CompressionPlugin = require('compression-webpack-plugin');
var TerserPlugin = require('terser-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

var files = fs.readdirSync('./integrations');
var isProd = process.env.NODE_ENV === 'production';

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

var plugins = [
  new CompressionPlugin({
    cache: true,
    deleteOriginalAssets: false
  })
];

if (process.env.ANALYZE) {
  plugins.push(new BundleAnalyzerPlugin());
}

module.exports = {
  entry: entries,
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  output: {
    filename: '[name]/latest/[name].js',
    chunkFilename: 'vendor/[name].[contenthash].js',
    path: path.resolve(__dirname, 'build/integrations'),
    library: '[name]Integration',
    libraryTarget: 'umd'
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
      domify: '/node_modules/domify/index.js'
    }
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'build')
  },
  optimization: {
    moduleIds: 'hashed',
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          ecma: '2015',
          mangle: true,
          compress: true,
          output: {
            comments: false
          }
        }
      })
    ],

    splitChunks: {
      cacheGroups: {
        commons: {
          name: 'commons',
          chunks: 'all',
          minChunks: 2
        }
      }
    }
  },
  plugins: plugins
};
