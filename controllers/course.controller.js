const { Course, Enrollment, Student } = require("../models");
const { Op } = require("sequelize");

const handleError = (res, err) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

// -------------------
// Create Course (Admin)
// -------------------
exports.createCourse = async (req, res) => {
  try {
    const {
      course_name,
      description,
      start_date,
      end_date,
      enrollment_start_date,
      enrollment_deadline,
      year_level,
      semester
    } = req.body;

    // Validate required fields
    if (
      !course_name ||
      !description ||
      !start_date ||
      !end_date ||
      !enrollment_start_date ||
      !enrollment_deadline ||
      !year_level ||
      !semester
    ) {
      throw { statusCode: 400, message: "All fields are required" };
    }

    // Validate year_level and semester
    if (year_level < 1 || year_level > 5) {
      throw { statusCode: 400, message: "year_level must be between 1 and 5" };
    }
    if (![1, 2].includes(semester)) {
      throw { statusCode: 400, message: "semester must be 1 or 2" };
    }

    const course = await Course.create({
      course_name,
      description,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      enrollment_start_date: new Date(enrollment_start_date),
      enrollment_deadline: new Date(enrollment_deadline),
      year_level,
      semester
    });

    res.status(201).json({ success: true, data: course });
  } catch (err) {
    handleError(res, err);
  }
};

// -------------------
// Get All Courses
// -------------------
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.json({ success: true, data: courses });
  } catch (err) {
    handleError(res, err);
  }
};

// -------------------
// Get Course by ID
// -------------------
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    if (!course) throw { statusCode: 404, message: "Course not found" };
    res.json({ success: true, data: course });
  } catch (err) {
    handleError(res, err);
  }
};

// -------------------
// Update Course
// -------------------
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    if (!course) throw { statusCode: 404, message: "Course not found" };

    const {
      course_name,
      description,
      start_date,
      end_date,
      enrollment_start_date,
      enrollment_deadline,
      year_level,
      semester
    } = req.body;

    // Validate year_level and semester if provided
    if (year_level && (year_level < 1 || year_level > 5)) {
      throw { statusCode: 400, message: "year_level must be between 1 and 5" };
    }
    if (semester && ![1, 2].includes(semester)) {
      throw { statusCode: 400, message: "semester must be 1 or 2" };
    }

    await course.update({
      course_name: course_name || course.course_name,
      description: description || course.description,
      start_date: start_date ? new Date(start_date) : course.start_date,
      end_date: end_date ? new Date(end_date) : course.end_date,
      enrollment_start_date: enrollment_start_date
        ? new Date(enrollment_start_date)
        : course.enrollment_start_date,
      enrollment_deadline: enrollment_deadline
        ? new Date(enrollment_deadline)
        : course.enrollment_deadline,
      year_level: year_level || course.year_level,
      semester: semester || course.semester
    });

    res.json({ success: true, data: course });
  } catch (err) {
    handleError(res, err);
  }
};

// -------------------
// Delete Course
// -------------------
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    if (!course) throw { statusCode: 404, message: "Course not found" };

    await course.destroy();
    res.json({ success: true, message: "Course deleted successfully" });
  } catch (err) {
    handleError(res, err);
  }
};

// -------------------
// Get Courses Enrolled by a Student
// -------------------
exports.getStudentCourses = async (req, res) => {
  try {
    const userId = Number(req.user.user_id);

    const courses = await Course.findAll({
      include: [
        {
          model: Enrollment,
          as: "enrollments",
          where: { studentId: userId },
          required: true,
        },
      ],
    });

    res.json({ success: true, data: courses });
  } catch (err) {
    handleError(res, err);
  }
};

// -------------------
// Get Students in a Course
// -------------------
exports.getStudentsInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      throw { statusCode: 400, message: "courseId is required" };
    }

    const course = await Course.findByPk(courseId);
    if (!course) throw { statusCode: 404, message: "Course not found" };

    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [
        {
          model: Student,
          as: "student",
        },
      ],
    });

    const students = enrollments.map((enr) => enr.student);

    res.json({
      success: true,
      courseId,
      totalStudents: students.length,
      students,
    });
  } catch (err) {
    handleError(res, err);
  }
};

// -------------------
// Search Students for Course
// -------------------
exports.searchStudentsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const query = req.query.query || "";

    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId is required" });
    }

    const students = await Student.findAll({
      where: {
        [Op.or]: [
          { first_name: { [Op.like]: `%${query}%` } },
          { father_name: { [Op.like]: `%${query}%` } },
          { grand_father_name: { [Op.like]: `%${query}%` } },
          { christian_name: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { id_number: { [Op.like]: `%${query}%` } },
        ]
      },
      attributes: [
        "id",
        "first_name",
        "father_name",
        "grand_father_name",
        "christian_name",
        "email",
        "id_number",
        "department",
        "year"
      ],
      include: [
        {
          model: Enrollment,
          as: "enrollments",
          where: { courseId },
          required: false
        }
      ]
    });

    const formatted = students.map(s => ({
      id: s.id,
      fullName: `${s.first_name} ${s.father_name} ${s.grand_father_name}`,
      email: s.email,
      idNumber: s.id_number,
      department: s.department,
      year: s.year,
      alreadyEnrolled: s.enrollments.length > 0
    }));

    res.json({
      success: true,
      total: formatted.length,
      students: formatted
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.getAvailableCoursesForStudent = async (req, res) => {
  try {
    const studentId = Number(req.user.user_id);

    // Fetch the student to get their year
    const student = await Student.findByPk(studentId);
    if (!student) throw { statusCode: 404, message: "Student not found" };

    // Fetch courses for the student's year (and optionally semester)
    const courses = await Course.findAll({
      where: {
        year_level: student.year, // only courses for student's current year
      },
      include: [
        {
          model: Enrollment,
          as: "enrollments",
          where: { studentId },
          required: false, // include courses even if not enrolled
        },
      ],
      order: [["semester", "ASC"], ["course_name", "ASC"]],
    });

    // Format response
    const formattedCourses = courses.map((course) => ({
      id: course.id,
      course_name: course.course_name,
      description: course.description,
      semester: course.semester,
      start_date: course.start_date,
      end_date: course.end_date,
      enrollment_start_date: course.enrollment_start_date,
      enrollment_deadline: course.enrollment_deadline,
      alreadyEnrolled: course.enrollments.length > 0,
    }));

    res.json({
      success: true,
      student: {
        id: student.id,
        name: `${student.first_name} ${student.father_name} ${student.grand_father_name}`,
        year: student.year,
      },
      totalCourses: formattedCourses.length,
      courses: formattedCourses,
    });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};