const { Student } = require("../models");

const { Op } = require("sequelize");
const handleError = (res, err) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.findAll();
    res.json({ success: true, data: students });
  } catch (err) {
    handleError(res, err);
  }
};



exports.updateStudentByAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;

    // const student = await Student.findByPk(studentId);
    const student = await Student.findByPk(studentId, {
      attributes: { exclude: ["password", "resetToken"] },
    });
    if (!student)
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });

    await student.update(req.body);

    res.json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateOwnProfile = async (req, res) => {
  try {
    const student = await Student.findByPk(req.user.user_id);
    if (!student)
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });

    await student.update(req.body);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: student,
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteStudentByAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student)
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });

    await student.destroy();

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteOwnAccount = async (req, res) => {
  try {
    const student = await Student.findByPk(req.user.user_id);

    if (!student)
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });

    await student.destroy();

    res.json({
      success: true,
      message: "Your account has been deleted",
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.searchStudents = async (req, res) => {
  try {


    const { keyword } = req.params;

    const students = await Student.findAll({
      where: {
        [Op.or]: [
          { first_name: { [Op.like]: `%${keyword}%` } },
          { father_name: { [Op.like]: `%${keyword}%` } },
          { grand_father_name: { [Op.like]: `%${keyword}%` } },
          { christian_name: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } },
          { phone_number: { [Op.like]: `%${keyword}%` } },
          { id_number: { [Op.like]: `%${keyword}%` } },
        ],
      },
    });

    res.json({ success: true, data: students });
  } catch (err) {
    handleError(res, err);
  }
};
