const mongoose = require("mongoose");

const beneficiarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  name: String,
  accountNumber: String,
  ifsc: String,
  bankName: String,

  isVerified: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model("Beneficiary", beneficiarySchema);