const log = console.log;
const chalk = require("chalk");

// Headers for things we're about to do
function title(txt) {
  log("-->", chalk.blue(txt));
}

// User info
function body(txt) {
  log(txt);
}

// User info that could be hidden
function verbose(txt) {
  log(chalk.dim(txt));
}

// Bad stuff
function error(txt) {
  log(chalk.red(txt));
}

// Something that needs to be called out
function important(txt) {
  log(`\n  ${chalk.blue(txt)}\n`);
}

module.exports = {
  title,
  body,
  verbose,
  error,
  important
};
