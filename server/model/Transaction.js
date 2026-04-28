const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema(
  {
    feature: String,
    impact: Number,
    direction: String,
    description: String,
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    merchant: {
      type: String,
      default: "Unknown merchant",
    },

    category: {
      type: String,
      default: "general",
    },

    channel: {
      type: String,
      enum: ["card", "web", "mobile", "atm"],
      default: "card",
    },

    accountId: {
      type: String,
      default: "primary-account",
    },

    deviceId: {
      type: String,
      required: true,
    },

    location: {
      city: { type: String, required: true },
      country: { type: String, default: "IN" },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },

    // 🔥 FRAUD FEATURES
    features: {
      type: Map,
      of: Number,
      default: {},
    },

    // 🔥 SCORES (ML + RULE + GRAPH)
    scores: {
      ml: { type: Number, default: 0 },
      anomaly: { type: Number, default: 0 },
      rule: { type: Number, default: 0 },
      graph: { type: Number, default: 0 },
      risk: { type: Number, default: 0 },
    },

    adaptivePolicy: {
      otpThreshold: Number,
      blockThreshold: Number,
      spendingLimit: Number,
      profileConfidence: Number,
    },

    decision: {
      type: String,
      enum: ["allow", "otp", "block"],
      default: "allow",
    },

    status: {
      type: String,
      enum: ["approved", "pending_otp", "blocked"],
      default: "approved",
    },

    explanation: {
      reason: String,
      contributions: {
        type: [contributionSchema],
        default: [],
      },
    },
  },
  { timestamps: true }
);

// ✅ CORRECT INDEXES
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ deviceId: 1 });
transactionSchema.index({ "location.city": 1 });
transactionSchema.index({ "scores.risk": -1 }); // 🔥 important

module.exports = mongoose.model("Transaction", transactionSchema);