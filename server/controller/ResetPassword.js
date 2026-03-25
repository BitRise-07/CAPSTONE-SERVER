const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../model/User");

// This will send a reset password token to the user
const resetPasswordToken = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register",
      });
    }

    const token = crypto.randomUUID();

    await User.findOneAndUpdate(
      { email },
      {
        resetPasswordToken: token,
        resetPasswordExpiresIn: Date.now() + 5 * 60 * 1000, // 5 min
      },
    );

    const url = `http://localhost:3000/reset-password/${token}`;

    // 👉 --> send mail function ko call kr lena tum yha pe, #Raushan :)
    // await sendResetPasswordMail(email, url);

    return res.status(200).json({
      success: true,
      message: "Reset password email sent successfully",
      data: {
        token,
        url,
      },
    });
  } catch (error) {
    console.log("Error while generating reset token:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { password, confirmPassword, token } = req.body;

  if (!password || !confirmPassword || !token) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Passwords do not match",
    });
  }

  try {
    const userDetails = await User.findOne({
      resetPasswordToken: token,
    });

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (Date.now() > userDetails.resetPasswordExpiresIn) {
      return res.status(400).json({
        success: false,
        message: "Token expired. Please request again.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    userDetails.password = hashedPassword;
    userDetails.resetPasswordToken = undefined;
    userDetails.resetPasswordExpiresIn = undefined;

    await userDetails.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.log("Error while resetting password:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { resetPasswordToken, resetPassword };

// Devloped by HR-RAHMAN 😉