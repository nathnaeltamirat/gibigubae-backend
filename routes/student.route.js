const express = require("express");
const { authenticate } = require("../middlewares/authenticator.middleware");
const { authorizeAdmin } = require("../middlewares/authorizeAdmin.middleware");
const {
  getAllStudents,
  updateStudentByAdmin,
  deleteStudentByAdmin,
  searchStudents,
  deleteOwnAccount,
  updateOwnProfile,
  getStudentById,
} = require("../controllers/student.controller");
const studentRouter = express.Router();

studentRouter.get("/all", authenticate, authorizeAdmin, getAllStudents);
studentRouter.put(
  "/admin/update/:studentId",
  authenticate,
  authorizeAdmin,
  updateStudentByAdmin
);
studentRouter.delete(
  "/admin/delete/:studentId",
  authenticate,
  authorizeAdmin,
  deleteStudentByAdmin
);

studentRouter.put(
  "/update/me",
  authenticate,
  updateOwnProfile
);
studentRouter.delete(
  "/delete/me",
  authenticate,
  deleteOwnAccount
);

studentRouter.get(
  "/search/:keyword",
  authenticate,
  searchStudents
);

module.exports = studentRouter;
