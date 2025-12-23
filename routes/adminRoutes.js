const express = require('express');
const { authenticate } = require('../middlewares/authenticator.middleware');
const { authorizeAdmin } = require('../middlewares/authorizeAdmin.middleware');
const { manualPromotion } = require("../controllers/adminController");

const adminRouter = express.Router();

adminRouter.post(
  '/promote-students',
  authenticate,
  authorizeAdmin,
  manualPromotion 
);

module.exports = adminRouter;
