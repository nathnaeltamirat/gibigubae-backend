const express = require("express");
const analyticsRouter = express.Router();
const {authenticate} = require("../middlewares/authenticator.middleware");
const { authorizeAdmin } = require("../middlewares/authorizeAdmin.middleware");
// const { getAttendanceOverview, getTopMetrics, getGlobalCourseStats,getSingleCourseStats, getCourseListAnalytics, getCourseSummary, getCourseAnalyticsById } = require("../controllers/analytics.controller");
const {
  getAttendanceOverview,
  getTopMetrics,
  getAttendanceTrend
//   courseSummary,
//   courseList
} = require("../controllers/analytics.controller");

analyticsRouter.use(authenticate, authorizeAdmin);


analyticsRouter.get("/daily/overview", getAttendanceOverview);
analyticsRouter.get("/top-metrics", getTopMetrics);
analyticsRouter.get("/attendance-trend", getAttendanceTrend);


// analyticsRouter.get("/courses/summary",courseSummary);
// analyticsRouter.get("/courses", courseList);


// analyticsRouter.get("/courses",authenticate,authorizeAdmin,getGlobalCourseStats);
// analyticsRouter.get("/courses/:courseId",authenticate,authorizeAdmin,getSingleCourseStats);

// analyticsRouter.get("/course-list/:courseId", authenticate, authorizeAdmin,getCourseAnalyticsById);
// analyticsRouter.get("/course-summary", authenticate, authorizeAdmin,getCourseSummary);

module.exports = analyticsRouter;
