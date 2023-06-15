const mongoose = require("mongoose");
// const CBucket = mongoose.connection.model("CalanderBucket");
//
// const guildSnowflake = require("../snowflake").GenerateID;
const logging = require("@connibug/js-logging");

let rp = require('request-promise');
async function get_ical_from_url(url) {
    console.log("Downloading");
    return await rp(url)
        .then(function (string) {
            logging.log("ICal Download success at url " + url)
            return string;
        })
        .catch(function (err) {
            logging.error("ICal Download Failed at url " + url);
            logging.error(err);
        });
}

module.exports.ical_test = async () => {
    let ical = require('node-ical');

    let file = await get_ical_from_url("https://kent-fix.transgirl.space/?kent_id=192178");

    ical.parseICS(file, function(err, data) {
        if (err) logging.error(err);
        // console.log(data);

        for (let key in data){
            let en = data[key];
            console.log(key);
            console.log("- " + en.organizer.params.CN);
            console.log("- " + en.start);
            console.log("- " + en.end);
            console.log("- " + en.summary);
            console.log("- " + en.location);
            console.log("- " + en.description);
        }

        data.forEach(ent => {
           console.log(ent);
        });
    });
}
this.ical_test();
