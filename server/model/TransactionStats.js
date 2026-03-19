const mongoose = require("mongoose");

const transactionStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  avgAmount: Number,
  maxAmount: Number,

  txnCountLast1Hr: Number,
  txnCountLast24Hr: Number,

  lastTransactionAt: Date,
  lastTransactionLocation: {
    lat: Number,
    lon: Number
  }

}, { timestamps: true });

module.exports = mongoose.model("TransactionStats", transactionStatsSchema);