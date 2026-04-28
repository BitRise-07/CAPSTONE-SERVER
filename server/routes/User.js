const express = require("express");
const router = express.Router();

const {
  login,
  signup,
  sendOTP,
  changePassword
} = require("../controller/Auth");

const {
  resetPasswordToken,
  resetPassword
} = require("../controller/ResetPassword");

const { auth } = require("../middlewares/auth");

// ✅ AUTH ROUTES
router.post("/signup", signup);
router.post("/login", login);
router.post("/sendotp", sendOTP);
router.post("/changepassword", auth, changePassword);

// ✅ PASSWORD RESET
router.post("/reset-password-token", resetPasswordToken);
router.post("/reset-password", resetPassword);

module.exports = router;