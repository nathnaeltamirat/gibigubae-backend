const {
  Attendance,
  StudentAttendance,
  Enrollment,
  Course,
} = require("../models");

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

// exports.getTopMetrics = async (req, res) => {
//   try {
//     const courses = await Course.findAll({
//       include: [
//         {
//           model: Enrollment,
//           as: "enrollments",
//           attributes: ["studentId"],
//         },
//       ],
//     });

//     let bestCourse = null;
//     let worstCourse = null;

//     for (const course of courses) {
//       const totalStudents = course.enrollments.length;

//       // Find attendance sessions for this course
//       const sessions = await Attendance.findAll({
//         where: { courseId: course.id },
//         attributes: ["id"],
//       });

//       const sessionIds = sessions.map((s) => s.id);
//       const totalSessions = sessionIds.length;

//       let totalPossible = totalStudents * totalSessions;

//       let totalPresent = 0;

//       if (sessionIds.length > 0) {
//         // Count present attendance records
//         const presentRecords = await StudentAttendance.count({
//           where: {
//             attendanceId: sessionIds,
//             present: true,
//           },
//         });

//         totalPresent = presentRecords;
//       }

//       // compute rate
//       const rate =
//         totalPossible === 0 ? 0 : (totalPresent / totalPossible) * 100;

//       course.dataValues.attendance_rate = rate;

//       if (!bestCourse || rate > bestCourse.attendance_rate) bestCourse = course;
//       if (!worstCourse || rate < worstCourse.attendance_rate)
//         worstCourse = course;
//     }

//     return res.json({
//       success: true,
//       data: {
//         best_course: bestCourse
//           ? {
//               id: bestCourse.id,
//               name: bestCourse.course_name,
//               rate: (bestCourse.attendance_rate || 0).toFixed(2) + "%",
//             }
//           : null,
//         worst_course: worstCourse
//           ? {
//               id: worstCourse.id,
//               name: worstCourse.course_name,
//               rate: (worstCourse.attendance_rate || 0).toFixed(2) + "%",
//             }
//           : null,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching top metrics",
//     });
//   }
// };

// exports.getCourseAnalyticsById = async (req, res) => {
//   try {
//     const { courseId } = req.params;

//     if (!courseId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "courseId is required" });
//     }

//     const course = await Course.findByPk(courseId, {
//       include: [
//         { model: Enrollment, as: "enrollments" },
//         {
//           model: Attendance,
//           as: "Attendances",
//           include: [{ model: StudentAttendance, as: "StudentAttendances" }],
//         },
//       ],
//     });

//     if (!course) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Course not found" });
//     }

//     const totalEnroll = course.enrollments.length;
//     const allSessions = course.Attendances;
//     const sessionCount = allSessions.length;

//     let presentTotal = 0;
//     let totalMarks = 0;
//     let presentToday = 0;
//     let absentToday = 0;

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     allSessions.forEach((s) => {
//       s.StudentAttendances.forEach((a) => {
//         totalMarks++;
//         if (a.present) presentTotal++;

//         // track today's attendance
//         const sessionDate = new Date(s.date);
//         if (sessionDate >= today) {
//           if (a.present) presentToday++;
//           else absentToday++;
//         }
//       });
//     });

//     const attendanceRate =
//       totalMarks > 0 ? (presentTotal / totalMarks) * 100 : 0;

//     let trend = "stable";
//     if (attendanceRate > 80) trend = "increasing";
//     if (attendanceRate < 50) trend = "decreasing";

//     const analytics = {
//       id: course.id,
//       name: course.course_name,
//       enrollment: totalEnroll,
//       attendance_rate: attendanceRate,
//       sessions: sessionCount,
//       alerts: absentToday > presentToday ? 1 : 0,
//       present_today: presentToday,
//       absent_today: absentToday,
//       course_trend: trend,
//     };

//     res.json({ success: true, data: analytics });
//   } catch (err) {
//     handleError(res, err);
//   }
// };

// // ------------------------------------------------------
// // 4. COURSE SUMMARY (System-wide summary)
// // ------------------------------------------------------
// exports.getCourseSummary = async (req, res) => {
//   try {
//     if (req.user.role !== "admin" && req.user.role !== "super_admin")
//       throw { statusCode: 403, message: "Admin access required" };

//     const courses = await Course.findAll({
//       include: [
//         { model: Enrollment, as: "enrollments" },
//         {
//           model: Attendance,
//           include: [{ model: StudentAttendance }],
//         },
//       ],
//     });

//     let allRates = [];
//     let highest = null;
//     let lowest = null;

//     let totalEnrollments = 0;
//     let totalSessions = 0;

//     courses.forEach((course) => {
//       totalEnrollments += course.enrollments.length;
//       totalSessions += course.Attendances.length;

//       let presentCnt = 0;
//       let totalCnt = 0;

//       course.Attendances.forEach((a) => {
//         a.StudentAttendances.forEach((sa) => {
//           totalCnt++;
//           if (sa.present) presentCnt++;
//         });
//       });

//       const rate = percent(presentCnt, totalCnt);

//       const summary = {
//         course: course.course_name,
//         rate,
//       };

//       allRates.push(summary);

//       if (!highest || rate > highest.rate) highest = summary;
//       if (!lowest || rate < lowest.rate) lowest = summary;
//     });

//     const avg =
//       allRates.length === 0
//         ? 0
//         : Number(
//             (
//               allRates.reduce((a, c) => a + c.rate, 0) / allRates.length
//             ).toFixed(2)
//           );

//     res.json({
//       success: true,
//       avg_attendance: avg,
//       total_enrollments: totalEnrollments,
//       highest_attended_course: highest,
//       lowest_attended_course: lowest,
//       total_sessions_all_courses: totalSessions,
//     });
//   } catch (err) {
//     handleError(res, err);
//   }
// };
