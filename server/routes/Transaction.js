const express = require("express");
const router = express.Router();
const { auth, isUser } = require("../middlewares/auth");

const {
    createTransaction,
    getMyTransactions,
    getAllTransactions
} = require("../controller/Transaction");


const {detectFraud} = require("../middlewares/detectFraud");
const {verifyTransaction} = require("../middlewares/verifyTransaction");
const { newUser } = require("../middlewares/newUser");

router.post("/create-transaction", auth, isUser,newUser, detectFraud, createTransaction);
router.post("/verify-and-create-transaction", auth, isUser, verifyTransaction);
router.get("/get-transactions", auth, isUser, getMyTransactions);
router.get("/get-all-transactions", auth, getAllTransactions);

module.exports = router;