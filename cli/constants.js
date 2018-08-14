const path = require("path");
const homedir = require("os").homedir();

module.exports = {
  AJS_PRIVATE_LOCATION: path.join(homedir, ".analytics.js-private")
};
