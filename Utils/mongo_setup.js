// Setup MongoDB
const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
console.log(process.env.mongodb_main);
mongoose.connect(process.env.mongodb_main).catch((err) => {
    console.log(err);
    process.exit(1);
});

// Load MongoDB Models
require("../api/models/MemberModel");
require("../api/models/CalanderBucketModel");
require("../api/models/IcalModel");

module.exports = mongoose;