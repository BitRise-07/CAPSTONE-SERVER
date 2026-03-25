const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { configDotenv } = require("dotenv");
const User = require("../model/User.js");
const Otp = require("../model/Otp.js");

configDotenv();

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email field is required",
      });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please login.",
      });
    }

    let otp = crypto.randomInt(100000, 1000000).toString();

    let result = await Otp.findOne({ otp });

    while (result) {
      otp = crypto.randomInt(100000, 1000000).toString();
      result = await Otp.findOne({ OTP: otp });
    }

    await Otp.create({
      email,
      otp,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    });
  } catch (error) {
    console.log("Error while sending OTP ", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

const signup = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, phone, otp } =
    req.body;

  try {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message: "ALL fields are required",
      });
    }

    if (confirmPassword !== password) {
      return res.status(400).json({
        success: false,
        message: "password and confirmPassword should be same",
      });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exist",
      });
    }

    const recentOtp = await Otp.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    if (recentOtp.length == 0) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    } else if (otp !== recentOtp[0].OTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Unique account number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100000 + Math.random() * 900000);
    const accountNumber = `10${timestamp}${random}`;

    const newUser = await User.create({
      firstName,
      lastName,
      phone,
      accountNumber,
      email,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "user successfully created",
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        image: newUser.image,
        accountNumber: newUser.accountNumber,
      },
    });
  } catch (error) {
    console.log("Error while Sign up ", error.message);
    return res.status(500).json({
      success: false,
      message: "something went wrong. Please try again",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const payload = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      accountNumber: user.accountNumber,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
      })
      .status(200)
      .json({
        success: true,
        token,
        user: payload,
        message: "Login Successful",
      });
  } catch (error) {
    console.log("Error while Login ", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error. Try again",
    });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const user = await User.findById(req.user.id); // req.user comes from auth middleware

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { login, sendOTP, signup, changePassword };

// Devloped by HR-RAHMAN 😉