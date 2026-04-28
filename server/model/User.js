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

    // 🔥 BEHAVIOR PROFILE (VERY IMPORTANT)
    behavior: {
      avgAmount: { type: Number, default: 0 },
      stdAmount: { type: Number, default: 0 },
      maxAmount: { type: Number, default: 0 },

      transactionCount: { type: Number, default: 0 },

      commonDevices: { type: [String], default: [] },
      commonLocations: { type: [String], default: [] },

      lastTransactionAt: Date,
      lastLatitude: Number,
      lastLongitude: Number
    },

    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],

    image: String,

    resetPasswordToken: String,
    resetPasswordExpiresIn: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);