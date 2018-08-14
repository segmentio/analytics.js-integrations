const log = require("./log");

const { spawn } = require("child_process");

function exec(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);

    proc.stdout.on("data", data => {
      log.body(data);
    });

    proc.stderr.on("data", data => {
      log.verbose(data);
    });

    proc.on("close", code => {
      if (code === 0) resolve();
      else reject(code);
    });
  });
}

module.exports = exec;
