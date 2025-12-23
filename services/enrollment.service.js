const { Enrollment, Student, Course } = require("../models");

exports.enrollStudentSelf = async ({ studentId, courseId }) => {
  // 1. Student exists
  const student = await Student.findByPk(studentId);
  if (!student) {
    throw { statusCode: 404, message: "Student not found" };
  }

  // 2. Course exists
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw { statusCode: 404, message: "Course not found" };
  }

  // 3. Graduation check
  if (student.year > 5) {
    throw {
      statusCode: 400,
      message: "Graduated students cannot enroll",
    };
  }

  // 4. Year-level rule
  if (student.year !== course.year_level) {
    throw {
      statusCode: 403,
      message: "This course is not for your year level",
    };
  }

  // 6. Prevent duplicate enrollment
  const existing = await Enrollment.findOne({
    where: { studentId, courseId },
  });

  if (existing) {
    throw {
      statusCode: 400,
      message: "You are already enrolled in this course",
    };
  }

  // 7. Create enrollment
  return await Enrollment.create({ studentId, courseId });
};
