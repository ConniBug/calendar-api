"use strict";
const mongoose = require("mongoose");
const CBucket = mongoose.connection.model("CalanderBucket");

const codes = require("../../Utils/misc/error_codes").codes;

const eventFunctions = require("../../Utils/functions/eventFunctions");

const l = require("@connibug/js-logging");
const monitoring = require("../../Utils/monitor");


exports.getEventInfo = async (eventID) => {
  let member = await CBucket.find({ id: eventID }).catch((err) => {
    if (err) {
      console.log(err);
      l.log("getEventRecord had an error", "ERROR");
    }
  });
  return member;
};

exports.getEvents = async (req, res) => {
  let startTimestamp = new Date().getTime();

  let start_date, end_date = 0;

  let memberID = req.params.MemberID;
  let calanderID = req.params.CalanderID;

  let limit = req.body.limit;
  let title = req.body.title;
  let description = req.body.description;

  let eventArray = await eventFunctions.getEvents(memberID, calanderID, limit, title, description, start_date, end_date).catch((err) => {
    console.log("ERR: ", err);

    res.status(codes.Bad_Request);
    res.send("err");
  });
  res.status(codes.Ok);
  res.json(eventArray);

  let duration = new Date().getTime() - startTimestamp;
  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  l.log(`[ ${duration}ms ] - [ ${ip} ] - Get events`);

  monitoring.log(
      "getEvents - gateway",
      duration
  );
};

exports.createNewEvent = async (req, res) => {
  let startTimestamp = new Date().getTime();

  var memberID = req.params.MemberID;
  var calanderID = req.params.CalanderID;

  var response = await eventFunctions
    .newEvent(memberID, calanderID,
        req.body.title,
        req.body.description,
        req.body.start,
        req.body.end,
        req.body.location)
    .catch((err) => {
      console.log("ERR: ", err);
      res.status(codes.Bad_Request);
      return "error";
    });
  if (typeof response != "object" && response.includes("exists")) {
    res.status(codes.Conflict);
    res.send({ error: response });
    return;
  }
  if (response == "err") {
    res.status(codes.Bad_Request);
  } else {
    res.status(codes.Ok);
  }
  res.json({ response: { id: response } });

  monitoring.log(
    "newEvent - gateway",
    new Date().getTime() - startTimestamp
  );
};

exports.updateEvent = async (req, res) => {
  let startTimestamp = new Date().getTime();

  let memberID = req.params.MemberID;
  let calanderID = req.params.CalanderID;
  let eventID = req.params.EventID;

  let update = {};
  req.body.title ? (update.title = req.body.title) : null;
  req.body.description ? (update.description = req.body.description) : null;
  req.body.authorID ? (update.authorID = req.body.authorID) : null;
  req.body.calanderID ? (update.calanderID = req.body.calanderID) : null;
  req.body.start ? (update.eventStart = req.body.start) : null;
  req.body.end ? (update.eventEnd = req.body.end) : null;
  req.body.location ? (update.location = req.body.location) : null;

  l.log("Updating event id: " + eventID + " - with: " + JSON.stringify(update))

  let eventArray = await eventFunctions.updateEvent(eventID, update).catch((err) => {
    console.log("ERR: ", err);

    res.status(codes.Bad_Request);
    res.send("err");
  });
  res.status(codes.Ok);
  res.json(eventArray);

  let duration = new Date().getTime() - startTimestamp;
  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  l.log(`[ ${duration}ms ] - [ ${ip} ] - Get events`);

  monitoring.log(
      "getEvents - gateway",
      duration
  );
};

exports.updateMember = (req, res) => {
  res.status(codes.Ok);
  res.send("Disabled gateway.");
  // var response = Members.findOneAndUpdate({ id: req.params.MemberID
  // },req.body, { new: true }
  //     console.log("ERR: ", err);
  //     return ("err");
  // });

  // if (response == "err") {
  //     res.status(codes.Bad_Request);
  // } else {
  //     res.status(codes.Ok);
  // }
  // Members.findOneAndUpdate({ id: req.params.MemberID },
  //     req.body, { new: true },
  //     (err, Response) => {
  //         if (err) {
  //             res.status(codes.Bad_Request);
  //             res.send(err);
  //             return;
  //         }

  //         res.status(codes.Accepted);
  //         res.json(Response);
  //     }
  // );
};

exports.deleteEvent = async (req, res) => {
  let startTimestamp = new Date().getTime();

  let memberID = req.params.MemberID;
  let calanderID = req.params.CalanderID;
  let eventID = req.params.EventID;

  var response = await eventFunctions.deleteEvent(memberID, eventID).catch((err) => {
    console.log("ERR: ", err);
    res.status(codes.Bad_Request);
    return "err";
  });

  if (response === "err") {
    res.status(codes.Bad_Request);
  } else {
    res.status(codes.Ok);
  }
  res.json({ response: response });

  monitoring.log(
    "deleteMember - completed",
    new Date().getTime() - startTimestamp
  );
};

