const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 10 * 60, 
  },
});

// async function sendVerificationEmail(email, otp) {
//   await mailSender(email, "OTP Verification", otp);
// }

// OTPSchema.pre("save", async function (next) {
//   try {
//     if (this.isNew) {
//       await sendVerificationEmail(this.email, this.otp);
//     }
//     next();
//   } catch (error) {
//     console.log("Email error:", error);
//     next(); 
//   }
// });

module.exports = mongoose.model("OTP", OTPSchema);