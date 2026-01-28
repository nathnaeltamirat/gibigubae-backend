module.exports = {

  overview: `
    SELECT
      (SELECT COUNT(*) FROM "Students") AS total_students,
      (SELECT COUNT(*) FROM "Students" WHERE is_verified) AS verified_students,
      (SELECT COUNT(*) FROM "Students" WHERE is_graduated) AS graduated_students,
      (SELECT COUNT(*) FROM "Courses") AS total_courses,
      (SELECT COUNT(*) FROM "Enrollments") AS total_enrollments,
      (SELECT COUNT(*) FROM "Attendances") AS total_sessions
  `,

  courseList: ` -- (the big query we already wrote earlier) `,

  courseSummary: `
  WITH course_attendance AS (
    SELECT
      c.id,
      c.course_name,
      ROUND(
        SUM(CASE WHEN sa.present THEN 1 ELSE 0 END)::decimal
        / NULLIF(COUNT(sa.id), 0) * 100,
        2
      ) AS attendance_rate
    FROM "Courses" c
    LEFT JOIN "Attendances" a ON a."courseId" = c.id
    LEFT JOIN "StudentAttendances" sa ON sa.attendance_id = a.id
    GROUP BY c.id
  )

  SELECT
    ROUND(AVG(attendance_rate), 2) AS avg_attendance,

    (SELECT COUNT(*) FROM "Enrollments") AS total_enrollments,

    (SELECT course_name
     FROM course_attendance
     ORDER BY attendance_rate DESC NULLS LAST
     LIMIT 1) AS highest_attended_course,

    (SELECT course_name
     FROM course_attendance
     WHERE attendance_rate IS NOT NULL
     ORDER BY attendance_rate ASC
     LIMIT 1) AS lowest_attended_course,

    (SELECT COUNT(*) FROM "Attendances") AS total_sessions_all_courses
  FROM course_attendance;
  `,

  courseTrend: `
  WITH ordered_sessions AS (
    SELECT
      a."courseId",
      a.id AS attendance_id,
      a.date,
      ROW_NUMBER() OVER (
        PARTITION BY a."courseId"
        ORDER BY a.date DESC
      ) AS rn
    FROM "Attendances" a
  ),

  rates AS (
    SELECT
      os."courseId",
      CASE
        WHEN os.rn <= 7 THEN 'recent'
        WHEN os.rn BETWEEN 8 AND 14 THEN 'previous'
      END AS period,
      AVG(CASE WHEN sa.present THEN 1 ELSE 0 END)::decimal * 100 AS rate
    FROM ordered_sessions os
    JOIN "StudentAttendances" sa ON sa.attendance_id = os.attendance_id
    WHERE os.rn <= 14
    GROUP BY os."courseId", period
  )

  SELECT
    r1."courseId",
    COALESCE(r1.rate, 0) AS recent_rate,
    COALESCE(r2.rate, 0) AS previous_rate
  FROM rates r1
  LEFT JOIN rates r2
    ON r1."courseId" = r2."courseId"
   AND r2.period = 'previous'
  WHERE r1.period = 'recent';
  `
};
