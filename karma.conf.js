// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['browserify', 'mocha'],

    preprocessors: {
      '**/*.js': 'browserify'
    },

    browserify: {
      debug: true
    },

    files: ['lib/*.js', 'test/*.test.js', 'test/*.js'],

    reporters: ['spec'],

    browsers: ['ChromeHeadless']
  });
};
