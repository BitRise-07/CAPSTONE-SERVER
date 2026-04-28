const express = require("express");
const router = express.Router();

const { auth, isUser } = require("../middlewares/auth");

const {
  addTransaction,        // ✅ NEW controller (uses evaluateRisk)
  getMyTransactions,
  getAllTransactions
} = require("../controller/Transaction");

// ✅ CREATE TRANSACTION (fraud detection inside controller now)
router.post("/create-transaction", auth, isUser, addTransaction);

// ✅ USER TRANSACTIONS
router.get("/get-transactions", auth, isUser, getMyTransactions);

// ✅ ADMIN TRANSACTIONS
router.get("/get-all-transactions", auth, getAllTransactions);

module.exports = router;