const mongoose = require("mongoose");
const CBucket = mongoose.connection.model("CalendarBucket");

const guildSnowflake = require("../snowflake").GenerateID;
const l = require("@connibug/js-logging");
const websockets = require("../../services/web-sockets");

/**
 * Update event with new information
 * @param memberID
 * @param {string} eventID
 * @param {object} update
 * @returns {string} Status text.
 */
module.exports.updateEvent = async (memberID, eventID, update) => {
  if(update.calendarID)
    update.category = update.calendarID;

  websockets.send_message(memberID, {
    type: "update_event",
    data: {
      id: eventID,
      update: update,
    },
    at_time: Date.now(),
  });

  let doc = await CBucket.findOneAndUpdate({ id: eventID }, update);
  if(!doc) {
      throw "Failed to update event";
  }
  return await doc;
}

/**
 * Creates a new event in a calendar
 * @param {string} OwnerID
 * @param {string} calendarID
 * @param {string} title
 * @param {string} description
 * @param {string} start
 * @param {string} end
 * @param {string} location
 * @returns {string} Status text.
 */
module.exports.newEvent = async (OwnerID, calendarID,
                                 title, description, start, end, location) => {
  l.log(`Creating new event with: ${OwnerID} : ${calendarID} : ${title} : ${description} : ${start} : ${end} : ${location}`);

  if(!OwnerID || !calendarID || !start || !end) {
    throw "Missing required fields";
  }

  let tmp_NewEvent = new CBucket({
    id: guildSnowflake(false),
    title: title || "No title",
    description: description || "No event description",
    authorID: OwnerID,
    eventStart: start,
    eventEnd: end,
    calendarID: calendarID,
    location: location || "No location",
  });

  let res = await tmp_NewEvent.save();
  if(res == null) {
      throw "Failed to submit event record"
  }
  websockets.send_message(OwnerID, {
    type: "new_event",
    data: {
      id: res.id,
      title: title,
      description: description,
      start: start,
      end: end,
      location: location,
    },
    at_time: Date.now(),
  });
  return await res.id;
};



module.exports.getEvents = async (memberID, calendarID, limit, title, description, start_date, end_date) => {
  let filter = { authorID: memberID };
  limit ? filter["limit"] = limit : null;
  title ? filter["title"] = title : null;
  description ? filter["description"] = description : null;
  start_date ? filter["start_date"] = start_date : null;
  end_date ? filter["end_date"] = end_date : null;

  // .sort({'createdDate': -1})
  let res = await CBucket.find(filter).limit(limit ? limit : 0);
  if(res == null) {
      throw "Failed to find events"
  }
  return res;
};

/**
 * Delete an event based off the id
 * @param memberID
 * @param eventID
 * @returns {string} status text. Ok/Failed/Already Exists
 */
module.exports.deleteEvent = async (memberID, eventID) => {
  websockets.send_message(memberID, {
    type: "delete_event",
    data: {
      id: eventID,
    },
    at_time: Date.now(),
  });

  let response = await CBucket.find({ id: eventID, authorID: memberID }).catch((error) => {
    res.send(err);
    l.log(err, "ERROR", "deleteEvent");
    throw "err";
  });

  if (!response || response[0] === undefined || response === []) {
    // var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    l.log(`[ ${null} ] - Tried to delete an event that doesnt exist.`);
    throw "Tried to delete an event that doesnt exist.";
  }

  let deleteResponse = await CBucket.deleteOne({ id: eventID, authorID: memberID }).catch(
      (error) => {
        l.log(error, "ERROR", `deleteOne(${{ id: eventID, authorID: memberID }})`);
        throw "err";
      }
  );

  l.log("Delete response: " + deleteResponse, "delete event");
  return "Success.";
};
