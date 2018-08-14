const log = require("./log");

function exec(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);

    proc.stdout.on("data", data => {
      log.body(data);
    });

    proc.stderr.on("data", data => {
      log.error(data);
    });

    proc.on("close", code => {
      if (code === 0) resolve();
      else reject(code);
    });
  });
}

module.exports = exec;
