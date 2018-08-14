const log = require("./log");
const ora = require("ora");

const { exec: nodeExec } = require("child_process");

function exec(cmd, opts) {
  // The extra \n fixes a weird quirk of ora spinners
  const spinner = ora(cmd + "\n").start();

  return new Promise((resolve, reject) => {
    nodeExec(cmd, opts, (error, stdout, stderr) => {
      if (error) {
        spinner.stop();
        reject(error);
        return;
      }

      // stderr is often used for more 'verbose' log info instead of
      // actual "errors".
      log.verbose(stderr);
      log.body(stdout);

      spinner.stop();
      resolve(stdout, stderr);
    });
  });
}

module.exports = exec;
