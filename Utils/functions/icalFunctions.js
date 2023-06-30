const mongoose = require("mongoose");
const ical = mongoose.connection.model("ICal");
const ICAL = require('node-ical');


//
// const guildSnowflake = require("../snowflake").GenerateID;
const l = require("@connibug/js-logging");
const eventFunctions = require("../functions/eventFunctions");
const memberFunctions = require("../functions/memberFunctions");

const SnowflakeFnc = require("../snowflake").GenerateID;

let rp = require('request-promise');

async function get_ical_from_url(url) {
    console.log("Downloading");
    return await rp(url)
        .then(function (string) {
            l.log("ICal Download success at url " + url)
            return string;
        })
        .catch(function (err) {
            l.error("ICal Download Failed at url " + url);
            l.error(err);
        });
}


/**
 * Create a new ical subscription within ical table.
 * @param memberID
 * @param url
 */
module.exports.createNewIcal = async (memberID, url) => {
    l.debug(`Request to create new calander with : ${memberID} : ${url}`);

    let file = await get_ical_from_url("https://kent-fix.transgirl.space/?kent_id=192178");

    let parsed = ICAL.sync.parseICS(file);

    let calander_info  = parsed["vcalendar"];

    let new_cal_name = calander_info["WR-CALNAME"];
    let new_cal_colour = "blue";
    let calanderID = (await memberFunctions.createNewCalander(memberID, new_cal_name, new_cal_colour, false)).calanderID;

    l.debug("New calander created with id: " + calanderID);

    let icalID = SnowflakeFnc();
    let tmp_NewIcal = new ical({
        id: icalID,
        ownerID: memberID,
        url: url,
        calanderID: calanderID,
    });
    let res = await tmp_NewIcal.save();
    if(!res) {
        l.error("Failed to save new ical record");
        return { error: "Failed to save new ical record" };
    }
    l.debug("New ical record created with id: " + icalID);

    l.log("Creating events from ical file");

    for (let key in parsed){
        let en = parsed[key];
        if(en.type !== "VEVENT") {
            // Check for handled types
            if(['VCALENDAR'].includes(en.type))
                continue;
            l.warning("Not a vevent. Is a " + en.type);
            console.log(en);
            continue;
        }
        // let should_be_cal_name = en.organizer.params.CN + " - " + calander_info["WR-CALNAME"];

        let event = {
            title: en.summary,
            description: en.description,
            authorID: memberID,
            eventStart: en.start,
            eventEnd: en.end,
            calanderID: calanderID,
        };
        let newEV = eventFunctions.newEvent(
            event.authorID, event.calanderID,
            event.title, event.description,
            event.eventStart, event.eventEnd, event.location
        ).then((res) => {
            console.log("New event id:", res);
        });
    }
    return { id: icalID };
}
