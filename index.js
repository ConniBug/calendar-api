const l = require("@connibug/js-logging");
l.setupFileLogging("./");

// Setup environment
require("dotenv").config();
const port = process.env.PORT || 3000;
process.env.debug = process.env.debug === "True" ? "true" : "false";

// Setup Atatus
// let atatus = require("atatus-nodejs");
// atatus.start({
//   licenseKey: process.env.ATATUS_LICENSE_KEY,
//   appName: process.env.ATATUS_APP_NAME,
// });

// Setup utils
const mongoose = require("./Utils/mongo_setup");
require("./Utils/monitor");
require("./Utils/hashing");

const fs = require('fs');

const express= require("express");
const websockets = require("./services/web-sockets");
const https = require('https');
const http = require('http');

let cors = require('cors');
const allowlist = [
  "https://cal.transgirl.space", "http://cal.transgirl.space",
  "https://100.110.174.208:30000", "http://100.110.174.208:30000",
  "https://localhost:30000", "http://localhost:30000",
  "https://localhost", "http://localhost",
    "http://localhost:8080", "http://localhost:8080",
    "https://conni.lgbt", "http://conni.lgbt",
    "http://transgirl.space", "https://transgirl.space"
];let corsOptionsDelegate = function (req, callback) {
  let corsOptions = {};
  // console.log(req.header('Origin'));
  // console.log(allowlist.indexOf(req.header('Origin')));

  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = {
      origin: true,      // reflect (enable) the requested origin in the CORS response
      methods: true,     // enable all requested HTTP methods
    }
  }
  else
    corsOptions = { origin: false } // disable CORS for this request

  corsOptions.methods = ['GET', 'POST', 'PUT', 'DELETE'];

  callback(null, corsOptions) // callback expects two parameters: error and options
}

const app = express();

async function start() {
  l.log("--------------------------------------------------");
  l.log("Starting.");
  l.log("--------------------------------------------------");

  function event_logger(events) {
    events.forEach(event => {
      mongoose.connection.on(event.name, r => l.debug(event.message));
    });
  }
  event_logger([
    {name: 'connecting', message: "Reconnecting to MongoDB Server"},
    {name: 'connected', message: "Connecting to MongoDB Server 'connected'"},
    {name: 'open', message: "Connecting to MongoDB Server 'open'"},
    {name: 'disconnecting', message: "Disconnecting from MongoDB Server'"},
    {name: 'disconnected', message: "Connection to MongoDB Server has been lost.'"},
    {name: 'close', message: "Connection to MongoDB Server has been terminated.'"},
    {name: 'reconnected', message: "Reconnected to MongoDB Server.'"},
    {name: 'error', message: "An error has occurred.'"},
    {name: 'fullsetup', message: "Connected to a replica set and successfully connected to the primary and at least one secondary server."},
    {name: 'all', message: "All servers in replica set have connected."},
    {name: 'reconnectFailed', message: "Server has run out of connection tries."},
  ]);

  let tmp = mongoose.modelNames();
  l.verbose("Defined models " + tmp);
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cors(corsOptionsDelegate));

  const routes = require("./api/routes/routes");
  routes(app); // register the routes

  app.get("*", (req, res) => {
    l.log(req.originalUrl + " not found");
    res.status(404).send({ url: req.originalUrl + " not found" });
  });

  const httpServer = http.createServer(app);
  const httpsServer = https.createServer({
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  }, app);

  httpServer.listen(port, () => {
    l.log("API HTTP Server running on port " + port);
  });
  httpsServer.listen(443, () => {
    l.log("API HTTPS Server running on port 443");
  });

}

async function stop() {
  l.log("Server shutting down.")
}
start();