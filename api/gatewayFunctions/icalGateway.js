"use strict";
const mongoose = require("mongoose");

const codes = require("../../Utils/misc/error_codes").codes;

const icalFunctions = require("../../Utils/functions/icalFunctions");

const l = require("@connibug/js-logging");
const monitoring = require("../../Utils/monitor");

exports.createNewIcal = async (req, res) => {
  let startTimestamp = new Date().getTime();

  let memberID = req.params.MemberID;

  let response = await icalFunctions
    .createNewIcal(memberID, req.body.url)
    .catch((err) => {
      console.log("ERR: ", err);
      res.status(codes.Bad_Request);
      return "error";
    });
  if(!response) {
    res.status(codes.Bad_Request);
    res.send({ error: "No response from icalFunctions.createNewIcal" });
    return;
  }
  if (typeof response !== "object" && response.includes("exists")) {
    res.status(codes.Conflict);
    res.send({ error: response });
    return;
  }
  if (response === "err") {
    res.status(codes.Bad_Request);
  } else {
    res.status(codes.Ok);
  }
  res.json({ response: response });

  monitoring.log(
    "createNewIcal - gateway",
    new Date().getTime() - startTimestamp
  );
};

exports.getICals = async (req, res) => {
    let startTimestamp = new Date().getTime();

    let memberID = req.params.MemberID;

    let filter = {};
    req.body.id ? (filter.id = req.body.id) : null;
    // if ownerID is not provided, use memberID TODO: Should be privileged
    filter.ownerID = req.body.ownerID ? req.body.ownerID : memberID;
    req.body.url ? (filter.url = req.body.url) : null;
    req.body.calendarID ? (filter.calendarID = req.body.calendarID) : null;

    let icalArray = await icalFunctions.getIcals(filter).catch((err) => {
        console.log("ERR: ", err);

        res.status(codes.Bad_Request);
        res.send("err");
    });
    res.status(codes.Ok);
    res.json(icalArray);

    let duration = new Date().getTime() - startTimestamp;
    let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    l.log(`[ ${duration}ms ] - [ ${ip} ] - Get icals`);

    monitoring.log(
        "getIcals - gateway",
        duration
    );
}

exports.deleteIcal = async (req, res) => {
    let startTimestamp = new Date().getTime();

    let memberID = req.params.MemberID;
    let iCalID = req.params.iCalID;

    let icalArray = await icalFunctions.deleteIcal(memberID, iCalID).catch((err) => {
        console.log("ERR: ", err);

        res.status(codes.Bad_Request);
        res.send("err");
    });
    res.status(codes.Ok);
    res.json(icalArray);

    let duration = new Date().getTime() - startTimestamp;
    let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    l.log(`[ ${duration}ms ] - [ ${ip} ] - Delete ical`);

    monitoring.log(
        "deleteIcal - gateway",
        duration
    );
}