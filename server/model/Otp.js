const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
// const otpTemplate = require("../email/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    otp: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 6,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 5 * 60,
    },
});

// send mail
async function sendVerificationEmail(email, otp) {
    try {
        const mailResponse = await mailSender(
            email,
            "Verification Email from Vidyawati",
            // otpTemplate(otp)
            otp
        );
        console.log("Mail sent successfully:", mailResponse);
    } catch (error) {
        console.log("Error sending mail:", error);
        throw error;
    }
}

OTPSchema.pre("save", async function (next) {
    try {
        if (this.isNew) {
            await sendVerificationEmail(this.email, this.otp);
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model("OTP", OTPSchema);