const express = require("express");
const analyticsRouter = express.Router();
const {authenticate} = require("../middlewares/authenticator.middleware");
const { authorizeAdmin } = require("../middlewares/authorizeAdmin.middleware");
const { getAttendanceOverview, getTopMetrics, getCourseListAnalytics, getCourseSummary, getCourseAnalyticsById } = require("../controllers/analytics.controller");

analyticsRouter.get("/daily/overview", authenticate,authorizeAdmin, getAttendanceOverview);
// analyticsRouter.get("/top-metrics", authenticate, authorizeAdmin,getTopMetrics);
// analyticsRouter.get("/course-list/:courseId", authenticate, authorizeAdmin,getCourseAnalyticsById);
// analyticsRouter.get("/course-summary", authenticate, authorizeAdmin,getCourseSummary);

module.exports = analyticsRouter;
