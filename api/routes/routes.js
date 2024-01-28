"use strict";

const path = require("path");

module.exports = (app) => {
  const memberGateway = require("../gatewayFunctions/memberGateway");
  const authenticationGateway = require("../gatewayFunctions/authGateway.js");
  const testingGateway = require("../gatewayFunctions/testingGateway.js");
  const eventGateway = require("../gatewayFunctions/eventGateway.js");
  const icalGateway = require("../gatewayFunctions/icalGateway.js");

  const authWrapper = require("../proxys/auth");

  const monitoringUtils = require("./../../Utils/monitor");

  require("dotenv").config();

  /**
   *  Un-Authenticated Routes
   */
  //#region Un-Authenticated Routes

  app
      .route("/api/register")
      .post(memberGateway.createNewMember);

  app
      .route("/api/login")
      .post(memberGateway.login);

  //#endregion

  /**
   *  Authenticated Routes
   */
  //#region Authenticated Routes

  /**
   *
   *  Member Gateways
   *
   */
  //#region Member Gateway
  app
    .route("/api/:MemberID")
    .get(authWrapper, memberGateway.getMemberRecord)
    .put(authWrapper, memberGateway.updateMember)
    .delete(authWrapper, memberGateway.deleteMember);
  app
    .route("/api/:MemberID/calendar")
    .post(authWrapper, memberGateway.createNewCalendar)
    .delete(authWrapper, memberGateway.deleteCalendar);
  //#endregion

  /**
   *
   * Event Gateways
   *
   */
  app
      .route("/api/:MemberID/events/:CalendarID")
      .post(authWrapper, eventGateway.createNewEvent)
      .get(authWrapper, eventGateway.getEvents);

  app
      .route("/api/:MemberID/events/:CalendarID/:EventID")
      .put(authWrapper, eventGateway.updateEvent)
      .delete(authWrapper, eventGateway.deleteEvent);
  //#endregion

  /**
   *
   * ICal Gateways
   *
   */
  app
      .route("/api/:MemberID/ical")
      .get(authWrapper, icalGateway.getICals)
      .post(authWrapper, icalGateway.createNewIcal);

  app
      .route("/api/:MemberID/ical/:iCalID")
       .delete(authWrapper, icalGateway.deleteIcal);

  /**
   * Monitoring API
   */
  //#region Monitoring API

  app.route("/api/monitoring/data").get(monitoringUtils.data);

  app.get('/api/monitoring/front', function(req, res) {
    console.log(__dirname);
    res.sendFile(path.join(__dirname, '../../ana.html'));
  });

  //#endregion

  //#region Notification API

  app.route("/api/analysis/report").post(function (req, res) {
    console.log("New Report");
    console.log(req.body);
    console.log(req.params);
    res.send({status: "OK"});
  });
  //#endregion

  // #region Last FM Current Song API
  const request = require('request');
  app.route("/api/lastfm/current/:user").get(function (req, res) {
    const options = {
      'method': 'GET',
      'url': `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${req.params.user}&api_key=${process.env.LASTFM_APIKEY}&format=json`,
      'headers': {
      }
    };
    request(options, function (error, response) {
      if (error)
        throw new Error(error);
      res.send(response.body);
    });
  });
  //#endregion

  /**
   *  Testing Stuff
   */
  //#region Testing stuff

  app.route("/api/test/1").post(testingGateway.test1);


  app.get('/api/settings/front', function(req, res) {
    console.log(__dirname);
    res.sendFile(path.join(__dirname, '../../settings.html'));
  });

  //#endregion
};
