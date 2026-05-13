const express = require("express");
const router = express.Router();

const { auth, isUser, isAdmin } = require("../middlewares/auth");

const {
  addTransaction,       
  getMyTransactions,
  getAllTransactions
} = require("../controller/Transaction");

router.post("/create-transaction", auth, isUser, addTransaction);
router.get("/get-transactions", auth, isUser, getMyTransactions);
router.get("/get-all-transactions", auth, isAdmin, getAllTransactions);

module.exports = router;
