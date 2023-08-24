const jwt = require("jsonwebtoken");
const getUserInfo = require("../gatewayFunctions/memberGateway").getMemberInfo;
const logging = require("@connibug/js-logging");
const codes = require("../../Utils/misc/error_codes").codes;
const m = require("../../Utils/monitor");

async function isTokenValid(userID, submittedToken) {
  let timeTaken;
  let startTimestamp = new Date().getTime();

  let member = await getUserInfo(userID);
  if (!member) {
    logging.log(
      `isTokenValid - member failed to be found.`,
      "DEBUG",
      "isTokenValid"
    );
    return false;
  }

  let memberSecret = member.tokenSecret;

  // Decode submitted token using stored member secret.
  try {
    const decodedToken = jwt.verify(submittedToken, memberSecret);

    // Get user id from within JSON Token
    const tokenUserID = decodedToken.MemberID;

    timeTaken = new Date().getTime() - startTimestamp;
    if (userID && userID === tokenUserID) {
      // logging.debug("Valid token." + JSON.stringify(submittedToken));
      m.log("isTokenValid - valid", timeTaken);
      return true;
    }
    m.log("isTokenValid - invalid", timeTaken);
    return false;
  } catch (err) {
    timeTaken = new Date().getTime() - startTimestamp;
    logging.log(err, "ERROR", "isTokenValid");
    m.log("isTokenValid - error", timeTaken);
    logging.debug("Invalid token." + JSON.stringify(submittedToken));
    return false;
  }
}

module.exports.isTokenValid = isTokenValid;

module.exports.authWrapper = async (req, res, next) => {
  let startTimestamp = new Date().getTime();
  if (!req.headers.authorization) {
    res.status(codes.Unauthorized).json({ error: "Un-Authorised! 1" });
    m.log(
      "authWrapper - failed to pass headers",
      new Date().getTime() - startTimestamp
    );
    return;
  }
  const submittedToken = req.headers.authorization.split(" ")[1];

  let valid = await isTokenValid(req.params.MemberID, submittedToken);
  var timeTaken = new Date().getTime() - startTimestamp;

  if (!valid) {
    m.log("authWrapper - invalid token", timeTaken);
    logging.log(
      "Debug authentication failed as the token is invalid.",
      "DEBUG",
      "authWrapper"
    );
    res.status(codes.Unauthorized).json({ error: "Un-Authorised!" });
    return false;
  }
  m.log("authWrapper - valid", timeTaken);
  res.locals.user = req.params.MemberID;
  next();
  return true;
};
