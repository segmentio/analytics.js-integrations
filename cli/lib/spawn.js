const log = require("./log");
const ora = require("ora");

const { spawn: nodeSpawn } = require("child_process");

function spawn(cmd, args, opts) {
  // The extra \n fixes a weird quirk of ora spinners
  const spinner = ora(`${cmd} ${args.join(" ")}\n`).start();

  return new Promise((resolve, reject) => {
    const proc = nodeSpawn(cmd, args, opts);

    proc.stdout.on("data", data => {
      log.verbose(data.toString());
    });

    // stderr is often used for more 'verbose' log info instead of
    // actual "errors".
    proc.stderr.on("data", data => {
      log.verbose(data.toString());
    });

    proc.on("close", code => {
      spinner.stop();
      if (code === 0) resolve();
      else reject(code);
    });
  });
}

module.exports = spawn;
