const chalk = require("chalk");

// Headers for things we're about to do
function title(txt) {
  console.log("-->", chalk.blue(txt));
}

// User info
function body(txt) {
  console.log(txt);
}

// User info that could be hidden
function verbose(txt) {
  // Uses error by default so we can ignore the output in scripts
  console.error(chalk.dim(txt));
}

// Bad stuff
function error(txt) {
  console.error(chalk.red(txt));
}

// Something that needs to be called out
function important(txt) {
  console.log(`\n  ${chalk.blue(txt)}\n`);
}

module.exports = {
  title,
  body,
  verbose,
  error,
  important
};
