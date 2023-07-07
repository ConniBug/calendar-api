"use strict";
const mongoose = require("mongoose");
const Snowflake = require("../../Utils/snowflake").GenerateID;

/*

  id: '6786515934698815488',
  title: 'Testing Title',
  description: 'Event description
  authorID: '6784913793899053056',
  calendarID: '6784916491973181440',

  eventStart: timestamp
  eventEnd: timestamp
  tz: Europe/London # Could be stored in the timestamp
  repeating: true/false
  location_x: geo_y
  location_y: geo_x
  location_address: address
  location: Plain text if above not available

  allDay: true/false

  recipicantID: RecipicantID,
  
*/
const Schema = mongoose.Schema;
const CalendarBucketSchema = new Schema({
    id: { type: String, required: "Ned Bucket id fam." },
    title: { type: String, required: "Need title"},
    description: { type: String, required: "Need description"},
    authorID: { type: String, required: "authorID needed" },
    calendarID: { type: String, required: "calendar id needed" },

    eventStart: { type: Date },
    eventEnd: { type: Date },
    tx: { type: String },
    repeating: { type: String },
    timeframe: { type: String },

    location: { type: String },

    allDay: { type: Boolean },

    createdDate: { type: Date, default: Date.now },
});
module.exports = mongoose.model("CalendarBucket", CalendarBucketSchema);
