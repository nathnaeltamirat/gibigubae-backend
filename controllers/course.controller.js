const { Course, Enrollment,Student} = require("../models");
const { Op } = require("sequelize");

const handleError = (res, err) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

exports.createCourse = async (req, res) => {
  try {
    const {
      course_name,
      description,
      start_date,
      end_date,
      enrollment_start_date,
      enrollment_deadline,
    } = req.body;

    if (
      !course_name ||
      !description ||
      !start_date ||
      !end_date ||
      !enrollment_start_date ||
      !enrollment_deadline
    ) {
      throw { statusCode: 400, message: "All fields are required" };
    }

    const course = await Course.create({
      course_name,
      description,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      enrollment_start_date: new Date(enrollment_start_date),
      enrollment_deadline: new Date(enrollment_deadline),
    });

    res.status(201).json({ success: true, data: course });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.json({ success: true, data: courses });
  } catch (err) {
    handleError(res, err);
  }
};

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
    } = req.body;

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
    });

    res.json({ success: true, data: course });
  } catch (err) {
    handleError(res, err);
  }
};

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

exports.createCourse = async (req, res) => {
  try {
    const {
      course_name,
      description,
      start_date,
      end_date,
      enrollment_start_date,
      enrollment_deadline,
    } = req.body;

    if (
      !course_name ||
      !description ||
      !start_date ||
      !end_date ||
      !enrollment_start_date ||
      !enrollment_deadline
    ) {
      throw { statusCode: 400, message: "All fields are required" };
    }

    const course = await Course.create({
      course_name,
      description,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      enrollment_start_date: new Date(enrollment_start_date),
      enrollment_deadline: new Date(enrollment_deadline),
    });

    res.status(201).json({ success: true, data: course });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.json({ success: true, data: courses });
  } catch (err) {
    handleError(res, err);
  }
};

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
    } = req.body;

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
    });

    res.json({ success: true, data: course });
  } catch (err) {
    handleError(res, err);
  }
};

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

exports.getStudentCourses = async (req, res) => {
  try {
    const userId = Number(req.user.user_id);
    console.log(userId);
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

exports.getStudentsInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      throw { statusCode: 400, message: "courseId is required" };
    }

    // Validate course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      throw { statusCode: 404, message: "Course not found" };
    }

    // Get students through Enrollment
    const enrollments = await Enrollment.findAll({
      where: { courseId },
      include: [
        {
          model: require("../models").Student,
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


exports.searchStudentsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const query = req.query.query || "";

    if (!courseId) {
      return res.status(400).json({ success: false, message: "courseId is required" });
    }

    // Search students by any name field or email or ID number
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
          required: false // allow students not enrolled
        }
      ]
    });

    // Add a flag for frontend UI buttons
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
