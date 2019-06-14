'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

/**
 * Expose `tag-injector` integration.
 */

var TagInjector = (module.exports = integration('Tag Injector').option(
  'tags',
  []
));

/**
 * Initialize.
 *
 * @api public
 */

TagInjector.prototype.initialize = function() {
  var documentHead = document.getElementsByTagName('head')[0];
  if (documentHead !== undefined) {
    for (var i = 0; i < this.options.tags.length; i++) {
      var tag = this.options.tags[i];
      documentHead.appendChild(createElementFromTag(tag));
    }
  }

  // Typically, integrations do `this.load(this.ready)`. But `this.load()` will
  // fetch this integration's tags, of which there are none in this case.
  //
  // Therefore, to avoid crashes, we simply call `this.ready()`.
  //
  // For context: https://segment.atlassian.net/browse/GA-210
  this.hasLoaded = true;
  this.ready();
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */
TagInjector.prototype.loaded = function() {
  return this.hasLoaded === true;
};

function createElementFromTag(tag) {
  var element = document.createElement('script');
  element.setAttribute('data-injected-by', 'segment');

  if (tag.tagKind === 'url') {
    element.src = tag.tagValue;
  } else if (tag.tagKind === 'variable') {
    var scriptBody = mergeVariableTagBody(tag);
    element.appendChild(document.createTextNode(scriptBody));
  }

  return element;
}

function mergeVariableTagBody(tag) {
  var target = tag.variableName;
  var source = tag.tagValue;

  return [
    'window.' + target + ' = ' + 'window.' + target + ' || {}',
    '(function merge (target, source) {',
    '  for (var property in source) {',
    '    if (typeof source[property] === "object") {',
    '      target[property] = target[property] || source[property];',
    '      merge(target[property], source[property]);',
    '    } else {',
    '      target[property] = source[property];',
    '    }',
    '  }',
    '})(window.' + target + ' || {},' + source + ')'
  ].join(';\n');
}
