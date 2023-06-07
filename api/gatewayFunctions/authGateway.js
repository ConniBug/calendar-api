"use strict";
const codes = require("../../Utils/misc/error_codes").codes;

const mongoose = require("mongoose");
const Members = mongoose.connection.model("Members");

const logging = require("@connibug/js-logging");
const monitoring = require("../../Utils/monitor");

exports.reauth = (req, res) => {
  logging.log(
    `Trying to login as. ${req.params.MemberID} - providing hash: -${req.body.hash}-`
  );
  Members.find(
    { MemberID: req.params.MemberID, hash: req.body.hash },
    (err, Response) => {
      if (err) {
        res.status(codes.Bad_Request);
        res.send(err);
      }
      if (Response.length === 0) {
        res.status(codes.Not_Found);
        res.send(err);
      } else {
        res.status(codes.Ok);
        res.json(Response);
      }
    }
  );
};
