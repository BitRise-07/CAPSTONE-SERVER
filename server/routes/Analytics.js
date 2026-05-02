const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middlewares/auth");
const { dashboardSummary } = require("../controller/Analytics");
router.get("/get-analytics", auth, dashboardSummary);

module.exports = router;