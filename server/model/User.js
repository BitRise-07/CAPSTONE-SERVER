const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
  },

  balance: {
    type: Number,
    default: 10000,
  },

  lastLocation: {
    city: String,
    lat: Number,
    lon: Number,
  },

  lastDevice: {
    type: String,
  },

  lastTransactionTime: {
    type: Date,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);