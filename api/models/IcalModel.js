"use strict";
const mongoose = require("mongoose");
const Snowflake = require("../../Utils/snowflake").GenerateID;

/*

  id: '6786515934698815488',
  ownerID: '6784913793899053056',
  url: '6784916491973181440',

*/
const Schema = mongoose.Schema;
const ICalSchema = new Schema({
    id: { type: String, default: Snowflake, required: "Need id" },
    ownerID: { type: String, required: "Need ownerID" },
    url: { type: String, required: "Need url" },
    calanderID: { type: String, required: "Need calanderID" },

    createdDate: { type: Date, default: Date.now },
});
module.exports = mongoose.model("ICal", ICalSchema);
