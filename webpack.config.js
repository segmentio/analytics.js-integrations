const path = require('path');
const fs = require('fs-extra');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');

const files = fs.readdirSync('./integrations');

const entries = files.reduce((entries, file) => {
  const path = `./integrations/${file}/lib/index.js`;
  if (!fs.existsSync(path)) {
    return entries;
  }

  return {
    ...entries,
    [file]: path
  };
}, {});

module.exports = {
  entry: entries,
  mode: process.env.NODE_ENV || 'production',
  // devtool: 'inline-source-map',
  output: {
    filename: '[name]/[contenthash]/bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    moduleIds: 'hashed',
    minimize: true,
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
        ndhoule: {
          test: /[\\/]node_modules[\\/](setimmediate|component-emmitter|process|@ndhoule|is|segmentio-facade|debug|analytics-events|@segment\/analytics\.js\-integrations)[\\/]/,
          name: 'ajs-compat',
          chunks: 'all'
        }
      }
    }
  },
  plugins: [new CompressionPlugin(), new BundleAnalyzerPlugin()]
};
