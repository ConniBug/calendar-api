/**
 * Within this document do not catch any errors that will be handled by the
 * callers.
 */

const l = require("@connibug/js-logging");
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
 * create a new calander within user account.
 * @param memberID
 * @param name
 * @param colour
 * @param editable
 * @returns {string} status text. Ok/Failed/Already Exists
 */
module.exports.createNewCalander = async (memberID, name, colour, editable) => {
  if (debugMemberFuncs) {
    l.debug(`Request to create new calander with : ${memberID} : ${name} : ${colour} : ${editable}`);
  }

  let calID = SnowflakeFnc();

  let doc = await Members.find({ id: memberID }).clone().exec();

  if (!doc[0]) {
    l.error("Member not found " + memberID);
    return { status: "Member not found" };
  } doc = doc[0];

  doc.calanders.push({
    id: calID,
    name: name,
    colour: colour,
    editable: editable,
  });

  let res = await doc.save();
  if(!res) {
    l.error("Failed to save calander");
    return { status: "Failed to save calander" };
  }
  if (debugMemberFuncs)
    l.debug("New calander created with id: " + calID);

  return { calanderID: calID };
}

/**
 * Delete a calander based off the member id and calander id.
 * @param MemberID
 * @param CalanderID
 * @returns {string} status text. Ok/Failed/Already Exists
 */
module.exports.deleteCalander = async (MemberID, CalanderID) => {
  if (debugMemberFuncs) {
    l.debug(`Request to delete a calander with : ${MemberID} : ${CalanderID}`);
  }

  let doc = await Members.find({ id: MemberID }).clone().exec();

  if (!doc[0]) {
    l.error("Member not found " + MemberID);
    return { status: "Member not found" };
  } doc = doc[0];

  doc.calanders = doc.calanders.filter(function(e) { return e.id !== CalanderID })

  let res = await doc.save();
  if(!res) {
    l.error("Failed to save calander");
    return { status: "Failed to save calander" };
  }
  if (debugMemberFuncs)
    l.debug("Calander deleted with id: " + CalanderID);

  return { status: "Success" };
};

/**
 * Get a list of all members within database.
 * @returns {Array} List of members/status text.
 */
module.exports.getAllMembers = async () => {
  return await Members.find({});
};

/**
 * Create a new member
 * @param username
 * @param email
 * @param password
 * @returns {string} status text. Ok/Failed/Already Exists
 */
module.exports.createNewMember = async (username, email, password) => {
  if (debugMemberFuncs)
    l.debug(`Request to create user with username < ${username} > and email < ${email} >`);

  var check = await Members.find({
    $or: [{ email: email }, { username: username }],
  }); check = check[0];
  if (check) {
    l.debug(`Existing user found:  ${JSON.stringify(check)}`);

    if (check.email === email || check.username === username) {
      if (check.email === email && check.username === username) {
        if (debugMemberFuncs) l.debug("Email and username are matching.");
        return "email and username exists";
      } else {
        if (check.email === email) {
          if (debugMemberFuncs) l.debug("email is matching.");
          return "email exists";
        } else if (check.username === username) {
          if (debugMemberFuncs) l.debug("username is matching.");
          return "username exists";
        }
      }
    }
  }

  var hashedPassword = hashing.hash(password);
  if (debugMemberFuncs) 
    l.debug("hashed password: " + hashedPassword);

  let id = SnowflakeFnc();
  let tmp_NewMember = new Members({
    id: id,
    username: username,
    hash: hashedPassword,
    email: email,
  });

  await tmp_NewMember.save();

  l.debug("New account created with id: " + id);

  return { id: id };
};

/**
 * Delete a member based off the member id
 * @param MemberID
 * @returns {string} status text. Ok/Failed/Already Exists
 */
module.exports.deleteMember = async (MemberID) => {
  var response = await Members.find({ id: MemberID }).catch((error) => {
    res.send(err);
    l.log(err, "ERROR", "deleteMember");
    throw "err";
  });

  if (!response || response[0] === undefined || response === []) {
    l.log(`[ ${null} ] - Tried to delete a member that doesnt exist.`);
    throw "Tried to delete a member that doesnt exist.";
  }

  var deleteResponse = await Members.deleteOne({ id: MemberID }).catch(
    (error) => {
      l.log(error, "ERROR", `deleteOne(${{ id: MemberID }})`);
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

  let email = body.email;
  let password = body.password;
  let refresh = body.refresh === "true";
  if (refresh)
    console.log("Refresh token request");

  let response = (await Members.find({email: email}))[0];
  if (!response)
    return "Un-Authenticated";

  let tokenSecret = response.tokenSecret;

  // monitoring.log(
  //     "memberLogin - find user from email",
  //     new Date().getTime() - startTimestamp
  // );

  let valid_password = BCrypt.compareSync(
      password,
      response.hash
  );
  if (!valid_password)
    return "Un-Authenticated";

  monitoring.log(
      "memberLogin - BCrypt.compareSync",
      new Date().getTime() - startTimestamp
  );

  const secret = refresh ? crypto.randomBytes(256).toString("hex") : tokenSecret;
  let [token, expiry] = TokenFunc.createToken(response.id, secret);

  response.tokenSecret = secret;

  startTimestamp = new Date().getTime();
  await Members.findOneAndUpdate({id: response.id}, response, {
    new: true,
  });
  monitoring.log(
      "memberLogin - update db with new tokenSecret",
      new Date().getTime() - startTimestamp
  );

  return {id: response.id, token: token, expiry: parseInt(new Date().getTime() * 0.001) + parseInt(expiry)};
};

