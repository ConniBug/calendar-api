const mongoose = require("mongoose");
const CBucket = mongoose.connection.model("CalanderBucket");

const guildSnowflake = require("../snowflake").GenerateID;
const logging = require("@connibug/js-logging");

/**
 * Creates a new event in a calander
 * @param {string} OwnerID
 * @param {string} calanderID
 * @param {string} title
 * @param {string} description
 * @param {string} start
 * @param {string} end
 * @param {string} location
 * @returns {string} Status text.
 */
module.exports.newEvent = async (OwnerID, calanderID,
                                 title, description, start, end, location) => {
  let builtJSON = {
    id: guildSnowflake(false),
    title: title || "No title",
    description: description || "No event description",
    authorID: OwnerID,
    eventStart: start,
    eventEnd: end,
    calanderID: "default",
    // calanderID: calanderID,
    location: location || "No location",
  };
  if(!OwnerID)
    throw "Missing OwnerID";

  // console.log("Recieved message:", builtJSON);

  let tmp_NewEvent = new CBucket(builtJSON);

  let res = await tmp_NewEvent.save();
  if(res == null) {
      throw "Failed to submit event record"
  }
  return await res.id;
};


/**
 * Creates a new event in a calander
 * @param {string} OwnerID
 * @param {string} calanderID
 * @param {string} title
 * @param {string} description
 * @param {string} start_date
 * @param {string} end_date
 * @returns {string} Status text.
 */
module.exports.getEvents = async (memberID, calanderID, limit, title, description, start_date, end_date) => {
  var filter = { authorID: memberID };
  if(limit) filter["limit"] = limit;
  if(title) filter["title"] = title;
  if(description) filter["description"] = description;
  if(start_date) filter["start_date"] = start_date;
  if(end_date) filter["end_date"] = end_date;

  var res = await CBucket.find(filter).sort({'createdDate': -1}).limit(limit ? limit : 0);
  if(res == null) {
      throw "Failed to find events"
  }
  return res;
};

/**
 * Delete an event based off the id
 * @param {json} body res.body from http request.
 * @returns {string} status text. Ok/Failed/Already Exists
 */
module.exports.deleteEvent = async (memberID, eventID) => {
  var response = await CBucket.find({ id: eventID, authorID: memberID }).catch((error) => {
    res.send(err);
    logging.log(err, "ERROR", "deleteEvent");
    throw "err";
  });

  if (!response || response[0] == undefined || response == []) {
    // var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    logging.log(`[ ${null} ] - Tried to delete an event that doesnt exist.`);
    throw "Tried to delete an event that doesnt exist.";
  }

  var deleteResponse = await CBucket.deleteOne({ id: eventID, authorID: memberID }).catch(
      (error) => {
        logging.log(error, "ERROR", `deleteOne(${{ id: eventID, authorID: memberID }})`);
        throw "err";
      }
  );

  console.log("Delete response:", deleteResponse);

  return "Success.";
};
