"use strict";
const mongoose = require("mongoose");

const CBucket = mongoose.connection.model("CalanderBucket");

const codes = require("../../Utils/misc/error_codes").codes;

const eventFunctions = require("../../Utils/functions/eventFunctions");

const l = require("@connibug/js-logging");
const monitoring = require("../../Utils/monitor");

const formattingData = require("./../../Utils/functions/dataHandler");

async function getEventRecord(eventID) {
  var member = await CBucket.find({ id: eventID }).catch((err) => {
    if (err) {
      console.log(err);
      l.log("getEventRecord had an error", "ERROR");
    }
  });
  return member;
}

exports.getEventInfo = async (eventID) => {
  return await getEventRecord(eventID);
};

/**
 * Get events.
 * @param {any} req
 * @param {any} res
 */
exports.getEvents = async (req, res) => {
  let startTimestamp = new Date().getTime();

  let start_date, end_date = 0;

  var memberID = req.params.MemberID;
  var calanderID = req.params.CalanderID;

  var limit = req.body.limit;
  var title = req.body.title;
  var description = req.body.description;

  var eventArray = await eventFunctions.getEvents(memberID, calanderID, limit, title, description, start_date, end_date).catch((err) => {
    console.log("ERR: ", err);

    res.status(codes.Bad_Request);
    res.send("err");
  });
  res.status(codes.Ok);
  res.json(eventArray);

  let end = new Date().getTime();
  var duration = end - startTimestamp;

  var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  l.log(`[ ${duration}ms ] - [ ${ip} ] - List members`);

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
    .newEvent(memberID, calanderID, req.body.title,
        req.body.description, req.body.stat_date, req.body.end_date)
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

  var memberID = req.params.MemberID;
  var calanderID = req.params.CalanderID;
  
  var eventID = req.body.EventID;

  var response = await eventFunctions.deleteEvent(memberID, eventID).catch((err) => {
    console.log("ERR: ", err);
    res.status(codes.Bad_Request);
    return "err";
  });

  if (response == "err") {
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

exports.login = async (req, res) => {
  let startTimestamp = new Date().getTime();

  var response = await memberFunctions.memberLogin(req.body).catch((err) => {
    console.log("ERR: ", err);
    res.status(codes.Bad_Request);
    return "err";
  });

  if (response == "err") {
    res.status(codes.Bad_Request);
  } else {
    res.status(codes.Ok);
  }
  res.json({ response: response });

  monitoring.log("login - valid", new Date().getTime() - startTimestamp);
};
