const mongoose = require("mongoose");
const monitoring = require("./Utils/monitor");
const path = require("path");
const l = require("@connibug/js-logging");
l.setupFileLogging("./");
const express = require("express");
const app = express();

require("dotenv").config();
process.env.debug = process.env.debug == "True" ? true : false;

const port = process.env.PORT || 3000;

const hashing = require("./Utils/hashing");

if(!process.env.SALT_ROUNDS) {
  hashing.setup();
}
monitoring.output();

async function start() {
  l.log("--------------------------------------------------");
  l.log("Starting.");
  l.log("--------------------------------------------------");
  require("./Databases/DBs").initDBs();
  const servers = await require("./Databases/DBs").get();

  // console.log("=========================");
  // console.log("Servers");
  // servers.forEach((e) => {
  //   var ServerName = Object.keys(e)[0];
  //   console.log("|", ServerName, "- Databases:", undefined);
  // });
  // console.log("=========================");

  require("./api/models/MemberModel"); // created model loading here
  // require("./api/models/GuildModel"); // created model loading here
  require("./api/models/CalanderBucketModel"); // created model loading here

  let tmp = mongoose.modelNames();
  l.verbose("Defined models " + tmp);
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  const routes = require("./api/routes/routes");
  routes(app); // register the routes

  app.get("*", (req, res) => {
    l.log(req.originalUrl + " not found");
    res.status(404).send({ url: req.originalUrl + " not found" });
  });

  app.listen(port);
  l.log("Server RESTful API server started on: " + port);
}

start();