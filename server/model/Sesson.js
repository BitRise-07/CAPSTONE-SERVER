const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },

  ipAddress: String,
  location: {
    city: String,
    lat: Number,
    lon: Number
  },

  loginAt: Date,
  logoutAt: Date,

  isActive: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);