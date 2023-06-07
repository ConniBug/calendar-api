"use strict";
const mongoose = require("mongoose");
const servers = require("./../../Databases/DBs").getServers();

const Members = mongoose.connection.model("Members");

const codes = require("../../Utils/misc/error_codes").codes;

const memberFunctions = require("../../Utils/functions/memberFunctions");

const l = require("@connibug/js-logging");
const monitoring = require("../../Utils/monitor");

const formattingData = require("./../../Utils/functions/dataHandler");

async function getMemberRecord(memberID) {
  var member = await Members.find({ id: memberID }).catch((err) => {
    if (err) {
      console.log(err);
      l.log("getMemberRecord had an error", "ERROR");
    }
  });
  return member;
}

exports.getMemberInfo = async (memberID) => {
  return await getMemberRecord(memberID);
};

/**
 * Get all members within database.
 * @param {any} req
 * @param {any} res
 */
exports.listMembers = async (req, res) => {
  let startTimestamp = new Date().getTime();

  var memberArray = await memberFunctions.getAllMembers().catch((err) => {
    console.log("ERR: ", err);

    res.status(codes.Bad_Request);
    res.send("err");
  });
  res.status(codes.Ok);
  res.json(memberArray);

  let end = new Date().getTime();
  var duration = end - startTimestamp;

  var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  l.log(`[ ${duration}ms ] - [ ${ip} ] - List members`);
};

exports.createNewMember = async (req, res) => {
  let startTimestamp = new Date().getTime();

  var response = await memberFunctions
    .createNewMember(req.body.username, req.body.email, req.body.password)
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
    "createNewMember - gateway",
    new Date().getTime() - startTimestamp
  );
};

exports.getMemberRecord = async (req, res) => {
  var MemberID = req.params.MemberID;

  var member = await getMemberRecord(MemberID);
  member = member[0];

  res.json(
    formattingData.formatMemberData(member, formattingData.dataFormats.USER)
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

exports.deleteMember = async (req, res) => {
  let startTimestamp = new Date().getTime();

  var memberID = req.params.MemberID;

  var response = await memberFunctions.deleteMember(memberID).catch((err) => {
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
