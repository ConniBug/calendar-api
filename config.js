exports.conf = {
  channelName_Checks: {
    shortenChannelName: true, // Default: true
    maxLength: 100,
    replaceSpacesWithChar: true, // Default: true
  },
  messageText_Checks: {
    lengthLimit: true,
    maxLength: 100,
  },
  monitoring: {
    outputStats: false, // Default: true
    outputStatsEvery: 10000, // Currently: 10seconds // Default: 1000 ms
  },
};
