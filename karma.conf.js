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
    files: [
      'src/*.js',
      'test/*.test.js',
      'test/*.js'
    ],
    reporters: ['mocha'],
    browsers: ["ChromeHeadless"]
  });
};
