const server = require("./lib/server");
const cluster = require("cluster");
const os = require("os");

const app = {};

app.init = () => {
  if (cluster.isMaster) {
    for (i = 0; i < os.cpus().length; i++) {
      cluster.fork();
    }
  } else {
    server.init();
  }
};

app.init();
