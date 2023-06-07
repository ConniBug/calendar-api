const monitor = require("./monitor");
const bcrypt = require("bcrypt");

var saltRounds = 8;

/**
 * Used for benchmarking hasing speeds
 * @param {Integer} saltRounds
 * @returns
 */
function hashTiming(saltRounds_t) {
  let startTimestamp = new Date().getTime();

  // Generate Salt
  const salt = bcrypt.genSaltSync(saltRounds_t);

  // Hash Password
  bcrypt.hashSync("fdsbtyuktrdfghytr", salt);

  return new Date().getTime() - startTimestamp;
}

module.exports.setup = () => {
  var timeTaken = -1;

  var maxTimeAllowed = 1000;
  var leaway = 150;

  var bestRounds = -1;
  var bestTiming = -1;

  for (var curSalt = 1; curSalt <= 1000; ++curSalt) {
    var test1 = hashTiming(curSalt);
    var test2 = hashTiming(curSalt);
    var test3 = hashTiming(curSalt);

    timeTaken = test1 + test2 + test3;
    timeTaken /= 3;
    timeTaken = Math.round(timeTaken);

    console.log(
      `testing ${curSalt} - times taken: ${test1}ms, ${test2}ms, ${test3}ms - average: ${timeTaken}ms`
    );

    if (timeTaken <= maxTimeAllowed + leaway) {
      if (timeTaken > bestTiming) {
        bestRounds = curSalt;
        bestTiming = timeTaken;
      }
    } else {
      break;
    }
  }
  console.log(
    `Setting salt rounds to ${bestRounds} - time taken: ${bestTiming}ms`
  );
  saltRounds = bestRounds;
};

const hash = (text) => {
  let startTimestamp = new Date().getTime();

  // Generate Salt
  const salt = bcrypt.genSaltSync(saltRounds);

  // Hash Password
  const hash = bcrypt.hashSync(text, salt);

  monitor.log("hashing", new Date().getTime() - startTimestamp);

  return hash;
};

module.exports.hash = (text) => {
  return hash(text);
};
