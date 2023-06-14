const jwt = require("jsonwebtoken");
const l = require("@connibug/js-logging");

// done in seconds = 30 days
const leaseTime = (process.env.TOKEN_LEASE_TIME_DAYS * (60 * 60 * 24)) || process.env.TOKEN_LEASE_TIME_SECONDS || (60 * 60 * 24 * 30);
l.debug(`JWT Lease Time: ${leaseTime / 60 / 60 / 24} Days`);

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
