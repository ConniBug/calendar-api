"use strict";
const monitoring = require("./monitor");
const l = require("@connibug/js-logging");

// Declare snowflakey
const snowflakey = require("snowflakey");
// Create the worker instance
const Worker = new snowflakey.Worker({
  name: "TESTING",
  epoch: 1617278400,
  workerId: process.env.CLUSTER_ID || 1,
  processId: process.pid || undefined,
  workerBits: 8,
  processBits: 0,
  incrementBits: 14,
});

/**
 * Generate a unique snowflake for use in any way seen fit.
 * @returns {string} Unique snowflake
 */
module.exports.GenerateID = (log = true) => {
  // let startTimestamp = new Date().getTime();

  const flake = Worker.generate();
  if (log) {
    l.verbose(`Created snowflake: ${flake}`);
    l.verbose(
      `Creation date    : ${snowflakey.lookup(flake, Worker.options.epoch)}`
    );
    l.verbose(
      `Deconstructed    : ${Worker.deconstruct(flake).timestamp.valueOf()}`
    );
  }

  //monitoring.log("generateSnowFlake", new Date().getTime() - startTimestamp);
  return flake;
};

/**
 * Convert snowflake to string Date/Time
 * @param {string} SNowflake A Snowflake genrated using GenerateID()
 * @returns {string} Date/Time of snowflake creation
 */
module.exports.getString = (Snowflake) => {};
