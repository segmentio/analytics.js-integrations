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

    browsers: ['ChromeHeadless'],

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
