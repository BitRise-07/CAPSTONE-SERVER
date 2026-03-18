const otpSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  otp: String,

  purpose: {
    type: String,
    enum: ["TRANSACTION", "LOGIN"],
  },

  expiresAt: Date,
});

module.exports = mongoose.model("OTP", otpSchema);