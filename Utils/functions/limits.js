var config = require("./../../config").conf;

/**
 * Used to validate a channel name
 * @param {*} channelName
 * @returns valid channel name and output actions taken to the string.
 */
exports.channelName = (channelName) => {
  var cleanedChannelName = channelName;
  var actionsTaken = {
    shortenChannelName: false,
    replacedSpacesWithChar: false,
  };
  var isChanged = false;

  // shorten the channel name if its to long!
  // Done first to prevent large strings crashing the server.
  if (config.channelName_Checks.shortenChannelName) {
    if (cleanedChannelName.length > config.channelName_Checks.maxLength) {
      //console.log("To long by", cleanedChannelName.length - maxChannelNameLength, "letters.");
      actionsTaken.shortenChannelName = true;
      isChanged = true;

      cleanedChannelName = cleanedChannelName.substr(
        0,
        config.channelName_Checks.maxLength
      );
    }
  }

  // Check each letter for disallowed chars.
  // And add - instead of spaces.
  var builtString = "";
  var lastCharHypen = "";
  cleanedChannelName.split("").forEach((letter) => {
    if (config.channelName_Checks.replaceSpacesWithChar) {
      if (letter == " ") {
        // Letter is a space set it to a hypen
        letter = "-";
        if (lastCharHypen) letter = "";
        lastCharHypen = true;
        actionsTaken.replacedSpacesWithChar = true;
        isChanged = true;
      } else {
        lastCharHypen = false;
      }
    }

    builtString += letter;
  });
  cleanedChannelName = builtString;

  return {
    cleaned: cleanedChannelName,
    actions: actionsTaken,
    modified: isChanged,
  };
};

exports.messageText = (messageText) => {
  var cleanedMessageText = messageText;
  var actionsTaken = {
    shortenMessage: false,
  };
  var isChanged = false;

  // shorten the channel name if its to long!
  // Done first to prevent large strings crashing the server.
  console.log(config);
  if (config.messageText_Checks.lengthLimit) {
    if (cleanedMessageText.length > config.messageText_Checks.maxLength) {
      //console.log("To long by", cleanedChannelName.length - maxChannelNameLength, "letters.");
      actionsTaken.shortenMessage = true;
      isChanged = true;

      cleanedMessageText = cleanedMessageText.substr(
        0,
        config.messageText_Checks.maxLength
      );
    }
  }

  return {
    cleaned: cleanedMessageText,
    actions: actionsTaken,
    modified: isChanged,
  };
};
