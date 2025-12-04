const { Enrollment, Student, Course } = require("../models");

// Helper for consistent error responses
const handleError = (res, err) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

// ------------------------------
// Admin / SuperAdmin enrollment
// ------------------------------
exports.enrollByAdmin = async (req, res) => {
  try {
    const user = req.user; // injected by authentication middleware

    // Only admins or superadmins can use this route
    if (user.role !== "admin" && user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only Admins can enroll students",
      });
    }

    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "studentId and courseId are required",
      });
    }

    const studentEntity = await Student.findByPk(studentId);
    const courseEntity = await Course.findByPk(courseId);

    if (!studentEntity || !courseEntity) {
      return res.status(404).json({
        success: false,
        message: "Student or Course not found",
      });
    }

    // Prevent duplicate enrollment
    const existingEnroll = await Enrollment.findOne({
      where: { studentId, courseId },
    });
    if (existingEnroll) {
      return res.status(400).json({
        success: false,
        message: "Student is already enrolled in this course",
      });
    }

    const newEnroll = await Enrollment.create({ studentId, courseId });
    res.status(201).json({ success: true, data: newEnroll });
  } catch (err) {
    handleError(res, err);
  }
};

// ------------------------------
// Remove enrollment
// ------------------------------
exports.removeEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollmentEntity = await Enrollment.findByPk(id);
    if (!enrollmentEntity) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    await enrollmentEntity.destroy();
    res.json({ success: true, message: "Enrollment removed" });
  } catch (err) {
    handleError(res, err);
  }
};

// ------------------------------
// List all enrollments
// ------------------------------
exports.getEnrollments = async (_req, res) => {
  try {
    const enrollments = await Enrollment.findAll({
      include: [
        { model: Student, as: "student" },
        { model: Course, as: "course" },
      ],
    });
    res.json({ success: true, data: enrollments });
  } catch (err) {
    handleError(res, err);
  }
};
// ------------------------------
// Remove enrollment by studentId + courseId
// ------------------------------
exports.removeEnrollmentByAdmin = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "studentId and courseId are required",
      });
    }

    const enrollment = await Enrollment.findOne({
      where: { studentId, courseId },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    await enrollment.destroy();

    return res.json({
      success: true,
      message: "Enrollment removed successfully",
    });
  } catch (err) {
    handleError(res, err);
  }
};
