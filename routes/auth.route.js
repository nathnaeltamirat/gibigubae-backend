// routes/authRouter.js  (or auth.routes.js)

const express = require("express");
const authRouter = express.Router(); // Correct way in CommonJS
const multer = require("multer");

const {
  signUp,
  signIn,
  logout,
  refreshToken,
} = require("../controllers/auth.controller.js");

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

authRouter.post("/sign-up", upload.single("id_card"), signUp);
authRouter.post("/sign-in", signIn);
authRouter.post("/refresh-token", refreshToken);
authRouter.post("/logout", logout);

module.exports = authRouter;
