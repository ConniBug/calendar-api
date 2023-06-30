// Setup environment
require("dotenv").config();
process.env.debug = process.env.debug === "True" ? "true" : "false";

const port = process.env.PORT || 3000;

// Setup MongoDB
const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
mongoose.connect(process.env.mongodb_main, function(err) {
  if (err)
    console.error(err);
});

// Load MongoDB Models
require("./api/models/MemberModel");
require("./api/models/CalanderBucketModel");
require("./api/models/IcalModel");

const monitoring = require("./Utils/monitor");
const hashing = require("./Utils/hashing");

const ical = require("./Utils/functions/icalFunctions");

const path = require("path");
const l = require("@connibug/js-logging");
l.setupFileLogging("./");
const express = require("express");
var cors = require('cors');

const websockets = require("./services/web-sockets");

const allowlist = ['http://100.110.174.208:30000', 'https://cal.transgirl.space']
let corsOptionsDelegate = function (req, callback) {
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

if(!process.env.SALT_ROUNDS)
  hashing.setup();
// monitoring.output();

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

  app.listen(port);
  l.log("Server RESTful API server started on: " + port);
}

async function stop() {
  l.log("Server shutting down.")
}
start();