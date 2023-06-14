/**
 * Within this document do not catch any errors that will be handled by the
 * callers.
 */

const logging = require("@connibug/js-logging");
const monitoring = require("../monitor");
const mongoose = require("mongoose");
const Members = mongoose.connection.model("Members");

const hashing = require("../hashing");
const SnowflakeFnc = require("../snowflake").GenerateID;
const TokenFunc = require("../token");
const BCrypt = require(`bcrypt`);
const crypto = require("crypto");
require("dotenv").config();

const debugMemberFuncs = process.env.debug && true;

/**
 * Get a list of all members within database.
 * @returns {Array} List of members/status text.
 */
module.exports.getAllMembers = async () => {
  var memberArray = await Members.find({});
  return memberArray;
};

/**
 * Create a new member
 * @param {json} body res.body from http request.
 * @returns {string} status text. Ok/Failed/Already Exists
 */
module.exports.createNewMember = async (username, email, password) => {
  if (debugMemberFuncs)
    logging.debug(`Request to create user with username < ${username} >`);

  var check = await Members.find({
    $or: [{ email: email }, { username: username }],
  })[0];
  if (check) {
    if (debugMemberFuncs) 
      logging.debug(`Existing data found:  ${JSON.stringify(check)}`);
    
    if (check.email == email || check.username == username) {
      if (check.email == email && check.username == username) {
        if (debugMemberFuncs) logging.debug("Email and username are matching.");
        return "email and username exists";
      } else {
        if (check.email == email) {
          if (debugMemberFuncs) logging.debug("email is matching.");
          return "email exists";
        } else if (check.username == username) {
          if (debugMemberFuncs) logging.debug("username is matching.");
          return "username exists";
        }
      }
    }
  }

  var hashedPassword = hashing.hash(password);
  if (debugMemberFuncs) 
    logging.debug("hashed password: " + hashedPassword);

  var buildJson = {
    id: SnowflakeFnc(),
    username: username,
    hash: hashedPassword,
    email: email,
  };
  let tmp_NewMember = new Members(buildJson);

  await tmp_NewMember.save();

  if (debugMemberFuncs)
    logging.debug("New account created with id: " + buildJson.id);
  return { id: buildJson.id };
};

/**
 * Delete a member based off the member id
 * @param {json} body res.body from http request.
 * @returns {string} status text. Ok/Failed/Already Exists
 */
module.exports.deleteMember = async (MemberID) => {
  var response = await Members.find({ id: MemberID }).catch((error) => {
    res.send(err);
    logging.log(err, "ERROR", "deleteMember");
    throw "err";
  });

  if (!response || response[0] == undefined || response == []) {
    logging.log(`[ ${null} ] - Tried to delete a member that doesnt exist.`);
    throw "Tried to delete a member that doesnt exist.";
  }

  var deleteResponse = await Members.deleteOne({ id: MemberID }).catch(
    (error) => {
      logging.log(error, "ERROR", `deleteOne(${{ id: MemberID }})`);
      throw "err";
    }
  );

  console.log("Delete response:", deleteResponse);

  return "Success.";
};

/**
 * Loging to user account
 * @param {json} body res.body from http request.
 * @returns {string} status text.
 */
module.exports.memberLogin = async (body) => {
  let startTimestamp = new Date().getTime();

  var response = (await Members.find({ email: body.email }))[0];

  // monitoring.log(
  //     "memberLogin - find user from email",
  //     new Date().getTime() - startTimestamp
  // );

  if (!response) return "Un-Authenticated";

  var checkHashAgainstPassword = BCrypt.compareSync(
    body.password,
    response.hash
  );

  if (checkHashAgainstPassword) {
    monitoring.log(
      "memberLogin - BCrypt.compareSync",
      new Date().getTime() - startTimestamp
    );

    const secret = crypto.randomBytes(256).toString("hex");
    const token = TokenFunc.createToken(response.id, secret);
    response.tokenSecret = secret;

    startTimestamp = new Date().getTime();
    await Members.findOneAndUpdate({ id: response.id }, response, {
      new: true,
    });
    monitoring.log(
      "memberLogin - update db with new tokenSecret",
      new Date().getTime() - startTimestamp
    );

    return { id: response.id, token: token };
  } else {
    return "Un-Authenticated";
  }
};
