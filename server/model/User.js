const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    accountType: {
      type: String,
      enum: ["Admin", "User"],
      default: "User",
    },

    phone: String,

    accountNumber: {
      type: String,
      unique: true,
    },

    ifscCode: String,

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    image: String,

    balance: {
      type: Number,
      default: 10000,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: String,
    resetPasswordExpiresIn: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);