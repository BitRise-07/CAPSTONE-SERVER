// const mongoose = require("mongoose");

// const transactionStatsSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

//   avgAmount: {
//     type: Number,
//     default: 0
//   },
//   maxAmount: {
//     type: Number,
//     default: 0
//   },

//   lastDeviceId: String,

//   txnCountLast10M: {
//     type: Number,
//     default: 0
//   },
//   txnCountLast1H: {
//     type: Number,
//     default: 0
//   },

//   txnWindow10MStart: {
//     type: Date,
//     default: null
//   },
//   txnWindow1HStart: {
//     type: Date,
//     default: null
//   },

//   lastTransactionAt: Date,
//   lastLatitude: Number,
//   lastLongitude: Number,
//   lastTransactionAmount: {
//     type: Number,
//     default: 0
//   }

// }, { timestamps: true });

// module.exports = mongoose.model("TransactionStats", transactionStatsSchema);