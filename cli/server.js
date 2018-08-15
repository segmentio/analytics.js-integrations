const express = require("express");
const next = require("next");
const log = require("./lib/log");

async function start() {
  const port = parseInt(process.env.PORT, 10) || 4000;
  const dev = process.env.NODE_ENV !== "production";

  // without the __dirname, next will look for a `pages` directory where
  // the command is run
  const app = next({ dev, quiet: true, dir: __dirname });
  const handle = app.getRequestHandler();

  return app.prepare().then(() => {
    const server = express();

    server.get("*", (req, res) => {
      return handle(req, res);
    });

    server.listen(port, err => {
      if (err) throw err;
      log.important(`Demo site ready on http://localhost:${port}`);
    });
  });
}

module.exports = start;
