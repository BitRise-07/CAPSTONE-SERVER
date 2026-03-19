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
  accountType :{
        type: String,
        enum: ["Admin", "User",],
        required: true,
        default:"User"

    },

  phone: {
    type: String,
  },
  accountNumber: {
  type: String,
  unique: true
},

  balance: {
    type: Number,
    default: 10000,
  },
  isBlocked: {
  type: Boolean,
  default: false
},


  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
 