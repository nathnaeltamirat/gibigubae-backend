const express = require("express");
const enrollmentRouter = express.Router();


const { authenticate } = require("../middlewares/authenticator.middleware");
const { authorizeAdmin } = require("../middlewares/authorizeAdmin.middleware");
const { enrollByAdmin, removeEnrollment, getEnrollments, removeEnrollmentByAdmin } = require("../controllers/enrollment.controller");

// Admin routes
enrollmentRouter.post("/", authenticate,authorizeAdmin, enrollByAdmin);
enrollmentRouter.delete("/:id", authenticate,authorizeAdmin, removeEnrollment);
enrollmentRouter.get("/", authenticate,authorizeAdmin,getEnrollments);
enrollmentRouter.delete("/",authenticate,authorizeAdmin,removeEnrollmentByAdmin);

module.exports = enrollmentRouter;
