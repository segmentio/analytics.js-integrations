const log = console.log;
const chalk = require("chalk");

function title(txt) {
  log(chalk.blue(txt), "\n");
}

function body(txt) {
  log(txt);
}

function error(txt) {
  log(chalk.red(txt));
}

module.exports = {
  title,
  body,
  error
};
