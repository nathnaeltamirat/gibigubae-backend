const {
  Attendance,
  StudentAttendance,
  Enrollment,
  Course,
  Student
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





const calculateTrend = async (courseId) => {
  const sessions = await Attendance.findAll({
    where: { courseId },
    order: [["date", "DESC"]],
    limit: 10,
  });

  if (sessions.length < 6) return "stable";

  const recent = sessions.slice(0, 5);
  const previous = sessions.slice(5, 10);

  const calcRate = async (sessionGroup) => {
    let present = 0;
    let total = 0;

    for (const s of sessionGroup) {
      const { count, rows } = await StudentAttendance.findAndCountAll({
        where: { attendanceId: s.id },
      });

      present += rows.filter((r) => r.present).length;
      total += count;
    }

    return total === 0 ? 0 : (present / total) * 100;
  };

  const recentRate = await calcRate(recent);
  const previousRate = await calcRate(previous);

  const diff = recentRate - previousRate;

  if (diff > 5) return "increasing";
  if (diff < -5) return "decreasing";
  return "stable";
};


exports.getCourseListAnalytics = async (req, res) => {
  try {
    const courses = await Course.findAll();
    const today = new Date().toISOString().split("T")[0];
    const results = [];

    for (const course of courses) {

      const enrollment = await Enrollment.count({
        where: { courseId: course.id },
      });

      const sessions = await Attendance.findAll({
        where: { courseId: course.id },
      });

      const sessionIds = sessions.map((s) => s.id);
      const totalSessions = sessions.length;
      const totalPossible = enrollment * totalSessions;

      const totalPresent = await StudentAttendance.count({
        where: {
          attendanceId: sessionIds,
          present: true,
        },
      });

      const attendanceRate =
        totalPossible === 0 ? 0 : (totalPresent / totalPossible) * 100;

      const enrollments = await Enrollment.findAll({
        where: { courseId: course.id },
        include: [
          {
            model: Student,
            as: "student",
          },
        ],
      });

      let alerts = 0;

      for (const e of enrollments) {
        const absences = await StudentAttendance.count({
          where: {
            studentId: e.student.id,
            attendanceId: sessionIds,
            present: false,
          },
        });

        if (totalSessions > 0 && absences / totalSessions > 0.25) {
          alerts++;
        }
      }

      const todaySession = await Attendance.findOne({
        where: { courseId: course.id, date: today },
      });

      let presentToday = 0;
      let absentToday = 0;

      if (todaySession) {
        presentToday = await StudentAttendance.count({
          where: { attendanceId: todaySession.id, present: true },
        });

        absentToday = await StudentAttendance.count({
          where: { attendanceId: todaySession.id, present: false },
        });
      }

      const trend = await calculateTrend(course.id);

      results.push({
        name: course.course_name,
        enrollment,
        attendance_rate: Number(attendanceRate.toFixed(2)),
        sessions: totalSessions,
        alerts,
        present_today: presentToday,
        absent_today: absentToday,
        course_trend: trend,
      });
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load course analytics",
    });
  }
};





exports.getCourseSummaryAnalytics = async (req, res) => {
  try {
    const courses = await Course.findAll();

    let totalEnrollments = 0;
    let totalSessions = 0;
    let totalPresent = 0;
    let totalPossible = 0;

    let highestCourse = null;
    let lowestCourse = null;
    let highestRate = -1;
    let lowestRate = 101;

    for (const course of courses) {
      const enrollment = await Enrollment.count({
        where: { courseId: course.id },
      });

      const sessions = await Attendance.findAll({
        where: { courseId: course.id },
      });

      const sessionCount = sessions.length;
      const sessionIds = sessions.map((s) => s.id);

      const present = await StudentAttendance.count({
        where: {
          attendanceId: sessionIds,
          present: true,
        },
      });

      const possible = enrollment * sessionCount;
      const rate = possible === 0 ? 0 : (present / possible) * 100;

      totalEnrollments += enrollment;
      totalSessions += sessionCount;
      totalPresent += present;
      totalPossible += possible;

      if (rate > highestRate) {
        highestRate = rate;
        highestCourse = course.course_name;
      }

      if (rate < lowestRate) {
        lowestRate = rate;
        lowestCourse = course.course_name;
      }
    }

    const avgAttendance =
      totalPossible === 0 ? 0 : (totalPresent / totalPossible) * 100;

    res.json({
      success: true,
      data: {
        avg_attendance: Number(avgAttendance.toFixed(2)),
        total_enrollments: totalEnrollments,
        highest_attended_course: highestCourse,
        lowest_attended_course: lowestCourse,
        total_sessions_all_courses: totalSessions,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load course summary analytics",
    });
  }
};



exports.getAtRiskStudentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [
        {
          model: Student,
          as: "student",
        },
      ],
    });

    const attendances = await Attendance.findAll({
      where: { courseId },
      order: [["date", "ASC"]],
    });

    const attendanceIds = attendances.map((a) => a.id);
    const totalSessions = attendances.length;

    const atRiskStudents = [];

    for (const enrollment of enrollments) {
      const student = enrollment.student; 

      if (!student) continue; 

      const records = await StudentAttendance.findAll({
        where: {
          studentId: student.id,          
          attendanceId: attendanceIds,    
        },
        order: [["created_at", "DESC"]],
      });

      const presentCount = records.filter((r) => r.present).length;
      const rate =
        totalSessions === 0 ? 0 : (presentCount / totalSessions) * 100;

      let consecutiveAbsences = 0;
      for (const r of records) {
        if (!r.present) consecutiveAbsences++;
        else break;
      }

      if (rate < 75 || consecutiveAbsences >= 3) {
        const lastPresent = records.find((r) => r.present);

        atRiskStudents.push({
          name: `${student.first_name} ${student.father_name}`,
          department: student.department,
          overall_rate: Number(rate.toFixed(2)),
          consecutive_absences: consecutiveAbsences,
          courses_affected: 1,
          last_attended: lastPresent ? lastPresent.created_at : null,
          contact_info: {
            phone: student.phone_number,
            email: student.email,
          },
        });
      }
    }

    res.json({
      success: true,
      data: atRiskStudents,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch at-risk students",
    });
  }
};



exports.getAtRiskSummaryByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [
        {
          model: Student,
          as: "student",
        },
      ],
    });

    const attendances = await Attendance.findAll({
      where: { courseId },
    });

    const attendanceIds = attendances.map((a) => a.id);
    const totalSessions = attendances.length;

    let lowAttendance = 0;
    let consecutiveAbsence = 0;
    let both = 0;

    for (const enrollment of enrollments) {
      const student = enrollment.student; 

      if (!student) continue; 

      const records = await StudentAttendance.findAll({
        where: {
          studentId: student.id,        
          attendanceId: attendanceIds,  
        },
        order: [["created_at", "DESC"]],
      });

      const presentCount = records.filter((r) => r.present).length;
      const rate =
        totalSessions === 0 ? 0 : (presentCount / totalSessions) * 100;

      let consecutive = 0;
      for (const r of records) {
        if (!r.present) consecutive++;
        else break;
      }

      const low = rate < 75;
      const highAbsence = consecutive >= 3;

      if (low && highAbsence) both++;
      else if (low) lowAttendance++;
      else if (highAbsence) consecutiveAbsence++;
    }

    res.json({
      success: true,
      data: {
        total_at_risk: lowAttendance + consecutiveAbsence + both,
        by_threshold: {
          low_attendance: lowAttendance,
          consecutive_absences: consecutiveAbsence,
          both,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch at-risk summary",
    });
  }
};



exports.getCourseAttendanceAnalysis = async (req, res) => {
  try {
    const { courseId } = req.params;

    const attendances = await Attendance.findAll({
      where: { courseId },
      order: [["date", "ASC"]],
      include: [
        {
          model: Student,
          as: "students",
          through: { attributes: ["present"] },
        },
      ],
    });

    if (attendances.length === 0) {
      return res.json({
        success: true,
        data: {
          overall_rate: 0,
          by_day: [],
          by_time: null,
          trend: "stable",
        },
      });
    }

    let totalPresent = 0;
    let totalRecords = 0;
    const byDay = [];

    const dailyRates = [];

    for (const session of attendances) {
      const totalStudents = session.students.length;
      const present = session.students.filter(
        s => s.StudentAttendance.present
      ).length;

      const rate =
        totalStudents === 0 ? 0 : (present / totalStudents) * 100;

      dailyRates.push(rate);

      byDay.push({
        date: session.date,
        rate: Math.round(rate),
      });

      totalPresent += present;
      totalRecords += totalStudents;
    }

    const overallRate =
      totalRecords === 0 ? 0 : (totalPresent / totalRecords) * 100;

    // Trend logic
    const mid = Math.floor(dailyRates.length / 2);
    const firstHalf =
      dailyRates.slice(0, mid).reduce((a, b) => a + b, 0) / (mid || 1);
    const secondHalf =
      dailyRates.slice(mid).reduce((a, b) => a + b, 0) /
      (dailyRates.length - mid || 1);

    let trend = "stable";
    if (secondHalf - firstHalf > 5) trend = "increasing";
    else if (firstHalf - secondHalf > 5) trend = "decreasing";

    res.json({
      success: true,
      data: {
        overall_rate: Math.round(overallRate),
        by_day: byDay,
        by_time: null,
        trend,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to analyze course attendance",
    });
  }
};



exports.getCourseSessionEffectiveness = async (req, res) => {
  try {
    const { courseId } = req.params;

    const sessions = await Attendance.findAll({
      where: { courseId },
      include: [
        {
          model: Student,
          as: "students",
          through: { attributes: ["present"] },
        },
      ],
    });

    if (sessions.length === 0) {
      return res.json({
        success: true,
        data: {
          best_session: null,
          worst_session: null,
        },
      });
    }

    let best = null;
    let worst = null;

    for (const session of sessions) {
      const total = session.students.length;
      const present = session.students.filter(
        s => s.StudentAttendance.present
      ).length;

      const rate = total === 0 ? 0 : (present / total) * 100;

      if (!best || rate > best.rate) {
        best = { date: session.date, rate };
      }

      if (!worst || rate < worst.rate) {
        worst = { date: session.date, rate };
      }
    }

    res.json({
      success: true,
      data: {
        best_session: {
          date: best.date,
          rate: Math.round(best.rate),
        },
        worst_session: {
          date: worst.date,
          rate: Math.round(worst.rate),
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to evaluate session effectiveness",
    });
  }
};



exports.getSessionAttendanceBreakdown = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const session = await Attendance.findByPk(attendanceId, {
      include: [
        {
          model: Student,
          as: "students",
          through: { attributes: ["present"] },
        },
        {
          model: Course,
          as: "course",
          include: [{ model: Enrollment, as: "enrollments" }],
        },
      ],
    });

    if (!session) {
      return res.status(404).json({ message: "Attendance session not found" });
    }

    const totalStudentsInCourse = session.course.enrollments.length;

    const presentStudents = [];
    const absentStudents = [];

    for (const s of session.students) {
      const studentData = {
        id: s.id,
        name: `${s.first_name} ${s.father_name}`,
        department: s.department,
      };

      if (s.StudentAttendance.present) {
        presentStudents.push(studentData);
      } else {
        absentStudents.push(studentData);
      }
    }

    res.json({
      success: true,
      data: {
        total_students_in_course: totalStudentsInCourse,
        total_students_present: presentStudents.length,
        total_students_absent: absentStudents.length,
        present_students_list: presentStudents,
        absent_students_list: absentStudents,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch session attendance breakdown",
    });
  }
};


exports.getStudentMonthlyAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year, month } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await StudentAttendance.findAll({
      where: { studentId },
      include: [
        {
          model: Attendance,
          as: "attendance",
          where: {
            date: { [Op.between]: [startDate, endDate] },
          },
        },
      ],
      order: [[{ model: Attendance, as: "attendance" }, "date", "ASC"]],
    });

    const sessionsAttended = records.filter(r => r.present).length;
    const sessionsMissed = records.filter(r => !r.present).length;
    const totalSessions = records.length;

    const attendanceRate =
      totalSessions === 0
        ? 0
        : Math.round((sessionsAttended / totalSessions) * 100);

    const dailyRecords = records.map(r => ({
      date: r.attendance.date,
      present: r.present,
    }));

    res.json({
      success: true,
      data: {
        attendance_rate_for_month: attendanceRate,
        sessions_attended: sessionsAttended,
        sessions_missed: sessionsMissed,
        daily_records: dailyRecords,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly attendance",
    });
  }
};



exports.getMonthlyCourseSummary = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { year, month } = req.query;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0, 23, 59, 59);

    const sessions = await Attendance.findAll({
      where: {
        courseId,
        date: { [Op.between]: [start, end] },
      },
      include: [
        {
          model: Student,
          as: "students",
          through: { attributes: ["present"] },
        },
      ],
    });

    if (sessions.length === 0) {
      return res.json({
        success: true,
        data: {
          average_attendance: 0,
          best_student: null,
          worst_student: null,
          improvement_from_last_month: 0,
        },
      });
    }

    const studentStats = {};

    let totalPresent = 0;
    let totalRecords = 0;

    for (const session of sessions) {
      for (const s of session.students) {
        if (!studentStats[s.id]) {
          studentStats[s.id] = {
            name: `${s.first_name} ${s.father_name}`,
            present: 0,
            total: 0,
          };
        }

        studentStats[s.id].total++;
        if (s.StudentAttendance.present) {
          studentStats[s.id].present++;
          totalPresent++;
        }
        totalRecords++;
      }
    }

    const averageAttendance =
      totalRecords === 0 ? 0 : Math.round((totalPresent / totalRecords) * 100);

    let best = null;
    let worst = null;

    for (const id in studentStats) {
      const stat = studentStats[id];
      const rate = (stat.present / stat.total) * 100;

      if (!best || rate > best.rate) best = { name: stat.name, rate };
      if (!worst || rate < worst.rate) worst = { name: stat.name, rate };
    }

    const prevSessions = await Attendance.findAll({
      where: {
        courseId,
        date: { [Op.between]: [prevStart, prevEnd] },
      },
      include: [
        {
          model: Student,
          as: "students",
          through: { attributes: ["present"] },
        },
      ],
    });

    let prevRate = 0;
    let prevTotal = 0;
    let prevPresent = 0;

    for (const s of prevSessions) {
      for (const st of s.students) {
        prevTotal++;
        if (st.StudentAttendance.present) prevPresent++;
      }
    }

    if (prevTotal > 0) {
      prevRate = (prevPresent / prevTotal) * 100;
    }

    res.json({
      success: true,
      data: {
        average_attendance: averageAttendance,
        best_student: {
          name: best.name,
          rate: Math.round(best.rate),
        },
        worst_student: {
          name: worst.name,
          rate: Math.round(worst.rate),
        },
        improvement_from_last_month: Math.round(
          averageAttendance - prevRate
        ),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly course summary",
    });
  }
};



exports.getCourseParticipationInsights = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [
        {
          model: Student,
          as: "student",
        },
      ],
    });

    const sessions = await Attendance.findAll({
      where: { courseId },
      order: [["date", "ASC"]],
    });

    const sessionIds = sessions.map((s) => s.id);
    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return res.json({
        success: true,
        data: {
          frequently_absent_students: [],
          students_with_perfect_attendance: [],
          students_with_improving_trend: [],
        },
      });
    }

    const frequentlyAbsent = [];
    const perfectAttendance = [];
    const improvingTrend = [];

    for (const enrollment of enrollments) {
      const student = enrollment.student;
      if (!student) continue;

      const records = await StudentAttendance.findAll({
        where: {
          studentId: student.id,
          attendanceId: sessionIds,
        },
        order: [["created_at", "ASC"]],
      });

      const presentCount = records.filter((r) => r.present).length;
      const absentCount = totalSessions - presentCount;
      const rate = (presentCount / totalSessions) * 100;

      if (absentCount / totalSessions >= 0.25) {
        frequentlyAbsent.push({
          student_id: student.id,
          name: `${student.first_name} ${student.father_name}`,
          attendance_rate: Number(rate.toFixed(2)),
        });
      }

      if (presentCount === totalSessions) {
        perfectAttendance.push({
          student_id: student.id,
          name: `${student.first_name} ${student.father_name}`,
        });
      }

      if (records.length >= 6) {
        const mid = Math.floor(records.length / 2);
        const firstHalf = records.slice(0, mid);
        const secondHalf = records.slice(mid);

        const firstRate =
          firstHalf.filter((r) => r.present).length / firstHalf.length;
        const secondRate =
          secondHalf.filter((r) => r.present).length / secondHalf.length;

        if (secondRate - firstRate >= 0.2) {
          improvingTrend.push({
            student_id: student.id,
            name: `${student.first_name} ${student.father_name}`,
            from: Number((firstRate * 100).toFixed(2)),
            to: Number((secondRate * 100).toFixed(2)),
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        frequently_absent_students: frequentlyAbsent,
        students_with_perfect_attendance: perfectAttendance,
        students_with_improving_trend: improvingTrend,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course participation insights",
    });
  }
};



exports.getDepartmentAnalytics = async (req, res) => {
  try {
    const { department } = req.params;

    const students = await Student.findAll({
      where: { department },
    });

    const studentIds = students.map((s) => s.id);

    if (studentIds.length === 0) {
      return res.json({
        success: true,
        data: {
          average_attendance: 0,
          total_students: 0,
          total_courses: 0,
          overall_department_rank: null,
          attendance_improvement_rate: 0,
        },
      });
    }

    const enrollments = await Enrollment.findAll({
      where: { studentId: studentIds },
    });

    const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
    const totalCourses = courseIds.length;

    const attendances = await Attendance.findAll({
      where: { courseId: courseIds },
      order: [["date", "ASC"]],
    });

    const attendanceIds = attendances.map((a) => a.id);
    const totalSessions = attendances.length;

    let totalPresent = 0;
    let totalPossible = studentIds.length * totalSessions;
    let improvingStudents = 0;

    for (const student of students) {
      const records = await StudentAttendance.findAll({
        where: {
          studentId: student.id,
          attendanceId: attendanceIds,
        },
        order: [["created_at", "ASC"]],
      });

      const presentCount = records.filter((r) => r.present).length;
      totalPresent += presentCount;

      if (records.length >= 6) {
        const mid = Math.floor(records.length / 2);
        const firstHalf = records.slice(0, mid);
        const secondHalf = records.slice(mid);

        const firstRate =
          firstHalf.filter((r) => r.present).length / firstHalf.length;
        const secondRate =
          secondHalf.filter((r) => r.present).length / secondHalf.length;

        if (secondRate > firstRate) {
          improvingStudents++;
        }
      }
    }

    const averageAttendance =
      totalPossible === 0 ? 0 : (totalPresent / totalPossible) * 100;

    const attendanceImprovementRate =
      students.length === 0
        ? 0
        : (improvingStudents / students.length) * 100;

    const departments = await Student.findAll({
      attributes: ["department"],
      group: ["department"],
      where: {
        department: { [require("sequelize").Op.ne]: null },
      },
    });

    const departmentAverages = [];

    for (const d of departments) {
      const deptStudents = await Student.findAll({
        where: { department: d.department },
      });

      const deptStudentIds = deptStudents.map((s) => s.id);

      const deptEnrollments = await Enrollment.findAll({
        where: { studentId: deptStudentIds },
      });

      const deptCourseIds = [
        ...new Set(deptEnrollments.map((e) => e.courseId)),
      ];

      const deptAttendances = await Attendance.findAll({
        where: { courseId: deptCourseIds },
      });

      const deptAttendanceIds = deptAttendances.map((a) => a.id);

      const deptTotalPossible =
        deptStudentIds.length * deptAttendances.length;

      const deptTotalPresent = await StudentAttendance.count({
        where: {
          attendanceId: deptAttendanceIds,
          present: true,
        },
      });

      const avg =
        deptTotalPossible === 0
          ? 0
          : (deptTotalPresent / deptTotalPossible) * 100;

      departmentAverages.push({
        department: d.department,
        avg,
      });
    }

    departmentAverages.sort((a, b) => b.avg - a.avg);

    const rank =
      departmentAverages.findIndex(
        (d) => d.department === department
      ) + 1;

    // 6. Response
    res.json({
      success: true,
      data: {
        average_attendance: Number(averageAttendance.toFixed(2)),
        total_students: students.length,
        total_courses: totalCourses,
        overall_department_rank: rank || null,
        attendance_improvement_rate: Number(
          attendanceImprovementRate.toFixed(2)
        ),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department analytics",
    });
  }
};
