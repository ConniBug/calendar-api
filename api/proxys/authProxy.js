const jwt = require("jsonwebtoken");
const getUserInfo = require("../gatewayFunctions/memberGateway").getMemberInfo;
const logging = require("@connibug/js-logging");
const codes = require("../../Utils/misc/error_codes").codes;
const monitoring = require("../../Utils/monitor");

async function isTokenValid(userID, submittedToken) {
  var timeTaken;
  let startTimestamp = new Date().getTime();

  var member = await getUserInfo(userID);
  member = member[0];
  if (!member) {
    logging.log(
      `isTokenValid - member failed to be found.`,
      "DEBUG",
      "isTokenValid"
    );
    return false;
  }

  memberSecret = member.tokenSecret;
  // logging.log(`Token Validation - userId: ${userID} - MemberSecret:
  // ${memberSecret}`, "GENERIC");

  // Decode submitted token using stored member secret.
  try {
    const decodedToken = jwt.verify(submittedToken, memberSecret);

    // Get user id from within JSON Token
    const tokenUserID = decodedToken.MemberID;

    timeTaken = new Date().getTime() - startTimestamp;
    if (userID && userID == tokenUserID) {
      // logging.debug("Valid token." + JSON.stringify(submittedToken));
      monitoring.log("isTokenValid - valid", timeTaken);
      return true;
    }
    monitoring.log("isTokenValid - invalid", timeTaken);
    return false;
  } catch (err) {
    timeTaken = new Date().getTime() - startTimestamp;
    logging.log(err, "ERROR", "isTokenValid");
    monitoring.log("isTokenValid - error", timeTaken);
    logging.debug("Invalid token." + JSON.stringify(submittedToken));
    return false;
  }
}

module.exports.authWrapper = async (req, res, next) => {
  let startTimestamp = new Date().getTime();
  if (!req.headers.authorization) {
    res.status(codes.Unauthorized).json({ error: "Un-Authorised! 1" });
    monitoring.log(
      "authWrapper - failed to pass headers",
      new Date().getTime() - startTimestamp
    );
    return;
  }
  const submittedToken = req.headers.authorization.split(" ")[1];

  var valid = await isTokenValid(req.params.MemberID, submittedToken);
  var timeTaken = new Date().getTime() - startTimestamp;

  if (!valid) {
    monitoring.log("authWrapper - invalid token", timeTaken);
    logging.log(
      "Debug authentication failed as the token is invalid.",
      "DEBUG",
      "authWrapper"
    );
    res.status(codes.Unauthorized).json({ error: "Un-Authorised!" });
    return false;
  }
  monitoring.log("authWrapper - valid", timeTaken);
  next();
  return true;
};
