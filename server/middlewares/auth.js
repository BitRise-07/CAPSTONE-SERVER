const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

// ================= AUTH =================
exports.auth = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.body?.token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 🔥 IMPORTANT: Check user exists in DB
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Account is blocked",
        });
      }

      // Attach full user (better than just token data)
      req.user = user;
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Auth middleware error",
    });
  }
};

exports.isUser = async (req, res, next) => {
  try {
    if (req.user.accountType !== "User") {
      return res.status(403).json({
        success: false,
        message: "User access only",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Role verification failed",
    });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Role verification failed",
    });
  }
};

exports.transactionGuard = async (req, res, next) => {
  try {
    const user = req.user;

    // 🔹 Basic checks
    if (user.balance <= 0) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    // 🔹 Limit for new users (example rule)
    if (user.createdAt) {
      const accountAge =
        (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);

      if (accountAge < 1 && req.body.amount > 5000) {
        return res.status(403).json({
          success: false,
          message: "New users cannot send high amount",
        });
      }
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Transaction guard failed",
    });
  }
};
