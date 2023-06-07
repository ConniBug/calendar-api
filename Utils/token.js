const jwt = require("jsonwebtoken");
const l = require("@connibug/js-logging");

// done in seconds = 30 days
const leaseTime = 60 * 60 * 24 * 30;

/**
 *
 * @returns {string}
 */
module.exports.createToken = (memberID, secret) => {
  l.verbose("Generating new token!");
  var signed = jwt.sign({ MemberID: memberID }, secret, {
    expiresIn: leaseTime,
  });
  console.log(signed);
  l.verbose("Secret:" + secret);
  l.verbose("Expires In:" + leaseTime);
  l.verbose("---------------------");
  return signed;
};
