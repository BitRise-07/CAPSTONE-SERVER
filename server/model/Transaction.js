const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ["Success", "Failed", "Fraud"],
    default: "Success",
  },

  deviceId: {
     type: String,
     required: true, 

  },

  ipAddress: String,

  location: {
    lat: Number,
    lon: Number
  },

  
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);