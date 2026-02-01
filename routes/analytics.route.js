const express = require("express");
const analyticsRouter = express.Router();
const {authenticate} = require("../middlewares/authenticator.middleware");
const { authorizeAdmin } = require("../middlewares/authorizeAdmin.middleware");
// const { getAttendanceOverview, getTopMetrics, getGlobalCourseStats,getSingleCourseStats, getCourseListAnalytics, getCourseSummary, getCourseAnalyticsById } = require("../controllers/analytics.controller");
const {
  getAttendanceOverview,
  getTopMetrics,
  getAttendanceTrend,
  getCourseListAnalytics,
  getCourseSummaryAnalytics,
  getAtRiskStudentsByCourse,
  getAtRiskSummaryByCourse,
  getCourseAttendanceAnalysis,
  getCourseSessionEffectiveness,
  getSessionAttendanceBreakdown,
  getStudentMonthlyAttendance,
  getMonthlyCourseSummary,
  getCourseParticipationInsights,
  getDepartmentAnalytics
  // getCourseSessionEffectiveness
//   courseSummary,
//   courseList
} = require("../controllers/analytics.controller");

analyticsRouter.use(authenticate, authorizeAdmin);


analyticsRouter.get("/daily/overview", getAttendanceOverview);
analyticsRouter.get("/top-metrics", getTopMetrics);
analyticsRouter.get("/attendance-trend", getAttendanceTrend);
analyticsRouter.get("/courses", getCourseListAnalytics);
analyticsRouter.get("/courses/summary", getCourseSummaryAnalytics);
analyticsRouter.get("/courses/:courseId/at-risk-students", getAtRiskStudentsByCourse);
analyticsRouter.get("/courses/:courseId/at-risk-summary", getAtRiskSummaryByCourse);
analyticsRouter.get("/courses/:courseId/attendance-analysis", getCourseAttendanceAnalysis);
analyticsRouter.get("/courses/:courseId/session-effectiveness", getCourseSessionEffectiveness);
analyticsRouter.get("/attendance/:attendanceId/breakdown", getSessionAttendanceBreakdown);
analyticsRouter.get("/students/:studentId/monthly", getStudentMonthlyAttendance);
analyticsRouter.get("/courses/:courseId/monthly-summary", getMonthlyCourseSummary);
analyticsRouter.get("/courses/:courseId/participation-insights", getCourseParticipationInsights);
analyticsRouter.get("/departments/:department/overview", getDepartmentAnalytics);

// analyticsRouter.get("/courses", courseList);


// analyticsRouter.get("/courses",authenticate,authorizeAdmin,getGlobalCourseStats);
// analyticsRouter.get("/courses/:courseId",authenticate,authorizeAdmin,getSingleCourseStats);

// analyticsRouter.get("/course-list/:courseId", authenticate, authorizeAdmin,getCourseAnalyticsById);
// analyticsRouter.get("/course-summary", authenticate, authorizeAdmin,getCourseSummary);

module.exports = analyticsRouter;