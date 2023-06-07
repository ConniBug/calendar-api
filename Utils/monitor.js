var config = require("./../config").conf;

const logging = require("@connibug/js-logging");
const math = require("mathjs");

const template = (name_t) => ({
  name: name_t,
  data: [],
  averageTimes: {
    all: -1, // Time in ms
  },
  totalTime: 0,
  callCount: 0,
});

var data = [];

exports.output = () => {
  data.forEach((entry) => {
    console.log("-----------------------");
    console.log(entry.name);
    console.log(`Average Times: ${entry.averageTimes.all}ms`);
    console.log(`Total Time: ${entry.totalTime}ms`);
    console.log(`Called: ${entry.callCount} times`);
  });
};

function getSpecificDataSet(name) {
  var Times = [];
  var Ms = [];
  data.forEach((entry) => {
    // console.log("Entry name: ", entry.name, " - ", name);
    if (entry.name == name) {
      // console.log("Pushing");

      var i = 0;
      entry.data.forEach((r) => {
        Times.push(entry.data[i].timeStamp);
        Ms.push(entry.data[i].timeTaken);
        ++i;
      });
    }
  });

  // console.log(data);
  // console.log([ Times, Ms ]);

  return [Times, Ms];
}

exports.data = (req, res) => {
  var colours = [
    {
      bg: "rgb(255, 99, 132)",
      border: "rgb(255, 99, 132)",
    },
  ];

  var curColour = 0;

  function createDataSet(label, times) {
    return {
      label: label,
      backgroundColor: colours[curColour].bg,
      borderColor: colours[curColour].border,
      data: times,
    };
  }

  var all = [];

  if(req.body.target != "all")
    var dat = getSpecificDataSet(req.body.target);
  else
    dat = data;
  
  var times = dat[0];

  //console.log(times);
  var dataSet = createDataSet(
    req.body.target,
    getSpecificDataSet(req.body.target)[1]
  );
  //console.log(dataSet);

  all.push(dataSet);

  //console.log("All:",all[0]);

  res.json({ all: all[0], times: times });
};

exports.log = async (module_t, timeTaken) => {
  timeTaken = parseInt(timeTaken);

  var i = 0;
  var found = false;
  data.forEach((e) => {
    if (e.name == module_t) {
      var shouldHalf = false;
      if (data[i].averageTimes.all != -1) shouldHalf = true;

      // Submit data
      data[i].data.push({ timeTaken: timeTaken, timeStamp: getDateTime() });
      data[i].averageTimes.all += timeTaken + 1;
      data[i].totalTime += timeTaken;
      data[i].callCount += 1;

      if (shouldHalf) {
        data[i].averageTimes.all /= 2;
      }
      found = true;
    }
    ++i;
  });
  if (!found) {
    data.push(template(module_t));
    this.log(module_t, timeTaken);
  }
};

function getDateTime() {
  var date = new Date();

  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;

  var min = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;

  var sec = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;

  // var year = date.getFullYear();

  // var month = date.getMonth() + 1;
  // month = (month < 10 ? "0" : "") + month;

  // var day = date.getDate();
  // day = (day < 10 ? "0" : "") + day;

  return (
    /*year + ":" + month + ":" + day + " - " + */ hour + ":" + min + "." + sec
  );
}

if (config.monitoring.outputStats || 1) {
  setInterval(function () {
    console.log(
      "------------------------------------------------------------------------------------"
    );
    data.forEach((entry) => {
      console.log("");
      logging.log(`| ${entry.name} x${entry.callCount}`);
      logging.log(`--- Average Times: ${entry.averageTimes.all}ms`);
      logging.log(
        `--- Variation: ${ 0
            // math.std(entry.data)
        }ms`
      );
      logging.log(`--- Total Time: ${entry.totalTime}ms`);
      // logging.log(`--- Called: ${entry.callCount} times`);
    });
    console.log(
      "------------------------------------------------------------------------------------"
    );
  }, 5000);
  // }, config.monitoring.outputStatsEvery);
}
