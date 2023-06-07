"use strict";
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const MemberSchema = new Schema({
  // Never changed!!!!!!!!!!!!!!!!!!!!!!!   >:(
  id: { type: String, required: "Gib id" },
  createdDate: { type: Date, default: Date.now },

  // Set during account creation/modification
  username: { type: String, required: "A username is needed" },
  hash: { type: String, required: "Hash of password is needed" },
  phoneNumber: { type: String, default: "NA" },
  email: { type: String },
  calanders: { type: Array },

  // Filled in during first login
  token: { type: String, default: "NA", required: "Token. needed." },
  // Changed on every password based login
  tokenSecret: {
    type: String,
    default: "NA",
    required: "TokenSecret. needed.",
  },
});
module.exports = mongoose.model("Members", MemberSchema);
