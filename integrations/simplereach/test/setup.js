/* eslint strict: ['error', 'function'] */
(function() {
  'use strict';

  // If title === '', Simplereach uses document.href by default
  document.title = 'Simplereach Testing';

  // HACK(ndhoule): Tests are flaky and rely on a canonical URL being present on
  // the page
  var el = document.createElement('link');
  el.rel = 'canonical';
  el.href = 'http://mygreatreachtestsite.com/ogurl.html';
  document.head.appendChild(el);
}());
