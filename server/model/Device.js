const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  deviceId: String,
  deviceType: String, 
  browser: String,
  os: String,

  ipAddress: String,

  isTrusted: { type: Boolean, default: false },
  lastUsedAt: Date

}, { timestamps: true });

module.exports = mongoose.model("Device", deviceSchema);