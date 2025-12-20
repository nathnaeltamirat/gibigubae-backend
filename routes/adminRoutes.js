const express = require('express');
const { authenticate } = require('../middlewares/authenticator.middleware');
const { authorizeAdmin } = require('../middlewares/authorizeAdmin.middleware');
const { manualPromotion } = require("../controllers/adminController");
const { promoteStudents } = require('../utils/studentPromotion');

const adminRouter = express.Router();

adminRouter.post('/promote-students', authenticate, authorizeAdmin, async (req, res) => {
  try {
    await promoteStudents();
    res.json({ success: true, message: "Students promoted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to promote students" });
  }
});

module.exports = adminRouter;
