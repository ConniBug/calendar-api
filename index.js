const mongoose = require("mongoose");
const monitoring = require("./Utils/monitor");
const hashing = require("./Utils/hashing");

const ical = require("./Utils/functions/icalFunctions");

const path = require("path");
const l = require("@connibug/js-logging");
l.setupFileLogging("./");
const express = require("express");
var cors = require('cors');
var corsOptions = {
  origin: '*',
};

const app = express();

require("dotenv").config();
process.env.debug = process.env.debug === "True" ? "true" : "false";

const port = process.env.PORT || 3000;

if(!process.env.SALT_ROUNDS)
  hashing.setup();
// monitoring.output();

async function start() {
  l.log("--------------------------------------------------");
  l.log("Starting.");
  l.log("--------------------------------------------------");

  mongoose.set('strictQuery', true);
  mongoose.connect(process.env.mongodb_main, function(err) {
    if (err)
      console.error(err);
  });

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

  require("./api/models/MemberModel"); // created model loading here
  require("./api/models/CalanderBucketModel"); // created model loading here

  let tmp = mongoose.modelNames();
  l.verbose("Defined models " + tmp);
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(cors(corsOptions));

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