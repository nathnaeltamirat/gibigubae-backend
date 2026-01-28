const {
  Attendance,
  StudentAttendance,
  Enrollment,
  Course,
} = require("../models");
// const { sequelize } = require("../models");

const queries = require("../analytics/analytics.queries");

const { Op, fn, col } = require("sequelize");

const handleError = (res, err) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

// Utility: percentage
const percent = (num, den) =>
  den === 0 ? 0 : Number(((num / den) * 100).toFixed(2));

exports.getAttendanceOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Get today's attendance sessions
    const sessionsToday = await Attendance.findAll({
      where: { date: { [Op.between]: [today, tomorrow] } },
      attributes: ["id"],
    });

    const sessionIds = sessionsToday.map((s) => s.id);

    if (sessionIds.length === 0) {
      return res.json({
        success: true,
        today_rate: 0,
        total_sessions_today: 0,
        total_students_present_today: 0,
        total_students_absent_today: 0,
      });
    }

    // Count unique students present today
    const totalPresentResult = await StudentAttendance.findAll({
      where: { attendanceId: sessionIds, present: true },
      attributes: [[fn("DISTINCT", col("student_id")), "studentId"]],
    });
    const totalPresent = totalPresentResult.length;

    // Count unique students absent today
    const totalAbsentResult = await StudentAttendance.findAll({
      where: { attendanceId: sessionIds, present: false },
      attributes: [[fn("DISTINCT", col("student_id")), "studentId"]],
    });
    const totalAbsent = totalAbsentResult.length;

    const totalStudents = totalPresent + totalAbsent;

    res.json({
      success: true,
      today_rate: totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0,
      total_sessions_today: sessionIds.length,
      total_students_present_today: totalPresent,
      total_students_absent_today: totalAbsent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



exports.getTopMetrics = async (req, res) => {
  try {
    const courses = await Course.findAll({
      attributes: ["id", "course_name"],
      group: ["Course.id"],
    });

    let bestCourses = [];
    let worstCourses = [];
    let highestRate = null;
    let lowestRate = null;

    for (const course of courses) {
      // Get all sessions for this course
      const sessions = await Attendance.findAll({
        where: { courseId: course.id },
        attributes: ["id"],
      });

      const sessionIds = sessions.map((s) => s.id);
      const totalSessions = sessionIds.length;

      // Count enrolled students
      const totalEnrollments = await Enrollment.count({
        where: { courseId: course.id },
      });

      const totalPossible = totalEnrollments * totalSessions;

      // Skip courses with no meaningful attendance data
      if (totalPossible === 0) continue;

      // Count total present
      const totalPresent = await StudentAttendance.count({
        where: {
          attendanceId: sessionIds,
          present: true,
        },
      });

      const rate = (totalPresent / totalPossible) * 100;

      const courseMetric = {
        id: course.id,
        name: course.course_name,
        rate,
      };

      // BEST courses
      if (highestRate === null || rate > highestRate) {
        highestRate = rate;
        bestCourses = [courseMetric];
      } else if (rate === highestRate) {
        bestCourses.push(courseMetric);
      }

      // WORST courses
      if (lowestRate === null || rate < lowestRate) {
        lowestRate = rate;
        worstCourses = [courseMetric];
      } else if (rate === lowestRate) {
        worstCourses.push(courseMetric);
      }
    }

    return res.json({
      success: true,
      data: {
        best_courses: bestCourses.map((c) => ({
          id: c.id,
          name: c.name,
          rate: c.rate.toFixed(2) + "%",
        })),
        worst_courses: worstCourses.map((c) => ({
          id: c.id,
          name: c.name,
          rate: c.rate.toFixed(2) + "%",
        })),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching top metrics",
    });
  }
};


exports.getAttendanceTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7; // default 7 days
    const trend = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);

      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      // Get all attendance sessions for this day
      const sessions = await Attendance.findAll({
        where: { date: { [Op.between]: [day, nextDay] } },
        attributes: ["id"],
      });

      const sessionIds = sessions.map((s) => s.id);

      if (sessionIds.length === 0) {
        trend.push({ date: day.toISOString().split("T")[0], rate: 0 });
        continue;
      }

      // Count present and absent students
      const totalPresent = await StudentAttendance.count({
        where: { attendanceId: sessionIds, present: true },
      });

      const totalAbsent = await StudentAttendance.count({
        where: { attendanceId: sessionIds, present: false },
      });

      const totalStudents = totalPresent + totalAbsent;
      const rate = totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;

      trend.push({
        date: day.toISOString().split("T")[0],
        rate: Number(rate.toFixed(2)),
      });
    }

    res.json({ success: true, trend });
  } catch (err) {
    console.error(err);
    handleError(res, err);
  }
};
