const monitor = require("./monitor");
const bcrypt = require("bcrypt");

let saltRounds = 8;

/**
 * Used for benchmarking hasing speeds
 * @returns
 * @param saltRounds_t
 */
function hashTiming(saltRounds_t) {
  let startTimestamp = new Date().getTime();

  // Generate Salt
  const salt = bcrypt.genSaltSync(saltRounds_t);

  // Hash Password
  bcrypt.hashSync("fdsbtyuktrdfghytr", salt);

  return new Date().getTime() - startTimestamp;
}

if(!process.env.SALT_ROUNDS)
  module.exports.setup();

module.exports.setup = () => {

  let timeTaken = -1;

  let maxTimeAllowed = 1000;
  let leaway = 150;

  let bestRounds = -1;
  let bestTiming = -1;

  for (let curSalt = 1; curSalt <= 1000; ++curSalt) {
    let test1 = hashTiming(curSalt);
    let test2 = hashTiming(curSalt);
    let test3 = hashTiming(curSalt);

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
