const express = require("express");
const router = express.Router();

const { auth, isAdmin } = require("../middlewares/auth");
const {
  adminOverview,
  adminUsers,
  adminUserDetail,
  scoringGuide,
} = require("../controller/Admin");

router.get("/overview", auth, isAdmin, adminOverview);
router.get("/users", auth, isAdmin, adminUsers);
router.get("/users/:userId", auth, isAdmin, adminUserDetail);
router.get("/scoring-guide", auth, isAdmin, scoringGuide);

module.exports = router;
