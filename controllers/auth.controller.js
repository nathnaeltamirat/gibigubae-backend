const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Student, ConfessionFather } = require("../models");
const {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  NODE_ENV,
} = require("../config/env.js");
const { uploadToCloudinary } = require("../utils/cloudinary.js");

// Error handler
const handleError = (res, err) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

// Sign up
exports.signUp = async (req, res) => {
  try {
    const {
      first_name,
      father_name,
      grand_father_name,
      christian_name,
      id_number,
      email,
      password,
      gender,
      phone_number,
      department,
      year,
      dorm_block,
      room_number,
      confessionFatherId,
    } = req.body;

    // Required fields
    const requiredFields = [
      "first_name",
      "father_name",
      "grand_father_name",
      "id_number",
      "email",
      "password",
      "gender",
      "phone_number",
    ];
    for (const field of requiredFields) {
      if (!req.body[field])
        throw { statusCode: 400, message: `Missing required field: ${field}` };
    }

    // Check duplicate email
    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent)
      throw { statusCode: 400, message: "Student already exists" };

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Upload ID card
    if (!req.file)
      throw { statusCode: 400, message: "ID card image is required" };
    const id_card_image_path = await uploadToCloudinary(req.file, "id_card");

    // Create student
    const student = await Student.create({
      first_name,
      father_name,
      grand_father_name,
      christian_name,
      id_number,
      email,
      password: hashedPassword,
      gender,
      phone_number,
      department,
      year,
      dorm_block,
      room_number,
      id_card_image_path,
      role: "student",
      is_verified: false,
    });

    const token = jwt.sign(
      { user_id: student.id, email: student.email, role: student.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { user_id: student.id, email: student.email, role: student.role },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
    const ninetyDays = 1000 * 60 * 60 * 24 * 90;

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      maxAge: ninetyDays,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      maxAge: ninetyDays,
    });

    res.status(201).json({
      success: true,
      data: {
        id: student.id,
        first_name: student.first_name,
        email: student.email,
        role: student.role,
      },
    });
  } catch (err) {
    handleError(res, err);
  }
};

// Sign in
exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw { statusCode: 400, message: "Missing email or password" };

    const student = await Student.findOne({ where: { email } });
    if (!student) throw { statusCode: 404, message: "Student not found" };

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) throw { statusCode: 401, message: "Invalid credentials" };

    const token = jwt.sign(
      { user_id: student.id, email: student.email, role: student.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { user_id: student.id, email: student.email, role: student.role },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    const ninetyDays = 1000 * 60 * 60 * 24 * 90;

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      maxAge: ninetyDays,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      maxAge: ninetyDays,
    });
    res.json({
      success: true,
      data: {
        id: student.id,
        first_name: student.first_name,
        email: student.email,
        role: student.role,
      },
    });
  } catch (err) {
    handleError(res, err);
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie("auth_token");
  res.clearCookie("refresh_token");
  res.json({ success: true, message: "Logged out successfully" });
};

// Refresh token
exports.refreshToken = (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const newToken = jwt.sign(
      { user_id: decoded.user_id, email: decoded.email, role: decoded.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie("auth_token", newToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    });
    res.json({ success: true, message: "Token refreshed" });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
};
