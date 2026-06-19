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

    // Run headless Chrome with --no-sandbox: the CI container runs as root,
    // where Chrome's sandbox refuses to start. CHROME_BIN points at the
    // Chromium installed in .buildkite/Dockerfile.ci.
    browsers: ['ChromeHeadlessNoSandbox'],

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
      }
    },

    middleware: ['server'],
    failOnFailingTestSuite: false,

    plugins: [
      'karma-*',
      {
        'middleware:server': [
          'factory',
          function() {
            return function(request, response, next) {
              if (request.url === '/base/data' && request.method === 'POST') {
                var body = '';

                request.on('data', function(data) {
                  body += data;
                });

                request.on('end', function() {
                  try {
                    var data = JSON.parse(body);
                    response.writeHead(data.length === 3 ? 200 : 400);
                    return response.end(String(data.length === 3));
                  } catch (err) {
                    response.writeHead(500);
                    return response.end();
                  }
                });
              } else {
                next();
              }
            };
          }
        ]
      }
    ]
  });
};
