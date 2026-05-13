const express = require("express");
const router = express.Router();

const { auth, isUser, isAdmin } = require("../middlewares/auth");

const {
  addTransaction,       
  getMyTransactions,
  getAllTransactions,
  sendTransactionOtp,
  verifyTransactionOtp
} = require("../controller/Transaction");

router.post("/create-transaction", auth, isUser, addTransaction);
router.post("/:transactionId/send-otp", auth, isUser, sendTransactionOtp);
router.post("/:transactionId/verify-otp", auth, isUser, verifyTransactionOtp);
router.get("/get-transactions", auth, isUser, getMyTransactions);
router.get("/get-all-transactions", auth, isAdmin, getAllTransactions);

module.exports = router;
