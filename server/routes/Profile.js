const express = require("express");
const router = express.Router();

const { auth, isAdmin } = require("../middlewares/auth");
const {
  updateProfile, editProfile, getProfile
} = require("../controller/UpdateProfile");


// Update profile
router.put("/updateprofile", auth, updateProfile);

// Get current logged-in user profile
router.get("/me", auth, getProfile);


router.get("/editprofile", auth, editProfile);

module.exports = router;
