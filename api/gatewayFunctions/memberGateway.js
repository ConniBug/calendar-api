"use strict";
const mongoose = require("mongoose");

const CBucket = mongoose.connection.model("CalanderBucket");
const Members = mongoose.connection.model("Members");

const memberFunctions = require("../../Utils/functions/memberFunctions");

const l = require("@connibug/js-logging");
const monitoring = require("../../Utils/monitor");

const codes = require("../../Utils/misc/error_codes").codes;

async function getMemberRecord(memberID) {
  return await Members.find({id: memberID}).catch((err) => {
    if (err) {
      console.log(err);
      l.log("getMemberRecord had an error", "ERROR");
    }
  });
}

exports.getMemberInfo = async (memberID) => {
  let members = await getMemberRecord(memberID);
  return members[0];
};

/**
 * Get all members within database.
 * @param {any} req
 * @param {any} res
 */
exports.listMembers = async (req, res) => {
  let startTimestamp = new Date().getTime();

  let memberArray = await memberFunctions.getAllMembers().catch((err) => {
    console.log("ERR: ", err);

    res.status(codes.Bad_Request);
    res.send("err");
  });
  res.status(codes.Ok);
  res.json(memberArray);

  let end = new Date().getTime();
  let duration = end - startTimestamp;

  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  l.log(`[ ${duration}ms ] - [ ${ip} ] - List members`);
};

exports.createNewMember = async (req, res) => {
  let startTimestamp = new Date().getTime();

  let response = await memberFunctions
    .createNewMember(req.body.username, req.body.email, req.body.password)
    .catch((err) => {
      console.log("ERR: ", err);
      res.status(codes.Bad_Request);
      return "error";
    });
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
  res.json({ response: { id: response } });

  monitoring.log(
    "createNewMember - gateway",
    new Date().getTime() - startTimestamp
  );
};

exports.createNewCalendar = async (req, res) => {
  let startTimestamp = new Date().getTime();

  let memberID = req.params.MemberID;
  let name = req.body.name;
  let colour = req.body.colour;

  let response = await memberFunctions
    .createNewCalander(memberID, name, colour, true)
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
  if (response === "err") {
    res.status(codes.Bad_Request);
  } else {
    res.status(codes.Ok);
  }
  res.json({ response: { id: response.calanderID } });

  let duration = new Date().getTime() - startTimestamp;
  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  l.log(`[ ${duration}ms ] - [ ${ip} ] - Create new calendar`);

  monitoring.log("createNewCalendar - gateway", duration);
};

exports.deleteCalander = async (req, res) => {
  let startTimestamp = new Date().getTime();

  let memberID = req.params.MemberID;
  let calanderID = req.body.CalanderID;

  // TODO: This doesnt sync with the websockets
  // Create a separate thread to delete the calanders events.
  l.verbose(`Deleting events for calander ${calanderID}`);
  CBucket.deleteMany({ calanderID: `${calanderID}` }).catch((error) => {
    logging.log(err, "ERROR", "deleteEvents by calanderID - " + calanderID);
    throw "err";
  });

  let response = await memberFunctions.deleteCalander(memberID, calanderID).catch((err) => {
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

  let duration = new Date().getTime() - startTimestamp;
  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  l.log(`[ ${duration}ms ] - [ ${ip} ] - Delete calander`);

  monitoring.log(
      "deleteCalander - gateway",
      new Date().getTime() - startTimestamp
  );
};

exports.getMemberRecord = async (req, res) => {
  let startTimestamp = new Date().getTime();

  let MemberID = req.params.MemberID;

  let member = await getMemberRecord(MemberID);
  member = member[0];

  res.json(
    member
  );

  let duration = new Date().getTime() - startTimestamp;
  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  l.log(`[ ${duration}ms ] - [ ${ip} ] - Get member record`);

  monitoring.log(
      "getMemberRecord - gateway",
      new Date().getTime() - startTimestamp
  );
};

exports.updateMember = async (req, res) => {
  let startTimestamp = new Date().getTime();

  res.status(codes.Ok);
  res.send("Disabled gateway.");
  return;

  let memberID = req.params.MemberID;

  let update = {};
  req.body.username ? (update.username = req.body.username) : null;
  req.body.email ? (update.email = req.body.email) : null;

  let response = await Members.findOneAndUpdate({ id: req.params.MemberID}, update, { new: false });

  if (response === "err") {
      res.status(codes.Bad_Request);
  } else {
      res.status(codes.Ok);
  }
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
  let duration = new Date().getTime() - startTimestamp;
  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  l.log(`[ ${duration}ms ] - [ ${ip} ] - Update member`);

  monitoring.log(
      "updateMember - gateway",
      new Date().getTime() - startTimestamp
  );
};

exports.deleteMember = async (req, res) => {
  let startTimestamp = new Date().getTime();

  let memberID = req.params.MemberID;

  let response = await memberFunctions.deleteMember(memberID).catch((err) => {
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

  let duration = new Date().getTime() - startTimestamp;
  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  l.log(`[ ${duration}ms ] - [ ${ip} ] - Delete member`);

  monitoring.log("deleteMember - gateway", duration);
};

exports.login = async (req, res) => {
  let startTimestamp = new Date().getTime();
  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  let response = await memberFunctions.memberLogin(req.body, ip).catch((err) => {
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

  let duration = new Date().getTime() - startTimestamp;
  l.log(`[ ${duration}ms ] - [ ${ip} ] - Login valid`);

  monitoring.log("login - valid", duration);
};
