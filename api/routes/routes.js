"use strict";

const path = require("path");

module.exports = (app) => {
  const memberGateway = require("../gatewayFunctions/memberGateway");
  const authenticationGateway = require("../gatewayFunctions/authGateway.js");
  const testingGateway = require("../gatewayFunctions/testingGateway.js");
  const eventGateway = require("../gatewayFunctions/eventGateway.js");
  const icalGateway = require("../gatewayFunctions/icalGateway.js");

  const authWrapper = require("../proxys/authProxy").authWrapper;

  const monitoringUtils = require("./../../Utils/monitor");

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
    .route("/api/:MemberID/calander")
    .post(authWrapper, memberGateway.createNewCalendar)
    .delete(authWrapper, memberGateway.deleteCalander);
  //#endregion

  /**
   *
   * Event Gateways
   *
   */
  app
      .route("/api/:MemberID/events/:CalanderID")
      .post(authWrapper, eventGateway.createNewEvent)
      .get(authWrapper, eventGateway.getEvents);

  app
      .route("/api/:MemberID/events/:CalanderID/:EventID")
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
      .route("/api/:MemberID/ical/:IcalID");
      // .get(authWrapper, icalGateway.getICal)
      // .delete(authWrapper, icalGateway.deleteIcal);

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

  /**
   *  Testing Stuff
   */
  //#region Testing stuff

  app.route("/api/test/1").post(testingGateway.test1);

  //#endregion
};
