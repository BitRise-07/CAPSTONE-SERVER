// require("dotenv").config();
// const TransactionStats = require("../model/TransactionStats");
// const { finalRiskScore } = require("../utils/riskScore/finalRiskScore.js");
// const { isFraud } = require("../utils/riskScore/isFraud.js");
// const crypto = require("crypto");
// const Otp = require("../model/Otp.js");
// const mailSender = require("../utils/mailSender.js");
 
// exports.detectFraud = async (req, res, next) => {
//   try {
//     const { amount, deviceId, location } = req.body;
//     const userId = req.user.id;

//     if (req.isNewUser) {
//       if (amount <= 5000) {
//         req.status =  "success" ;
//         return next();
//       }

//       if (amount <= 25000) {
        
//         let otp = crypto.randomInt(100000, 1000000).toString();

//         await Otp.create({ email: req.user.email, otp });

//         await mailSender(
//           req.user.email,
//           "OTP Verification",
//           `Your OTP is: ${otp}`,
//         );

//         return res.json({
//           status: "OTP_REQUIRED",
//           message: "New user - OTP required",
//         });
//       }

//       req.status = "fraud";
//       return next();
//     }

//     const currentTime = new Date();

//     // 🔹 fetch stats
//     const stats = await TransactionStats.findOne({ userId });

//     // 🔹 calculate risk
//     const riskScore = finalRiskScore({
//       amount,
//       stats,
//       deviceId,
//       location, 
//       currentTime,
//     });

//     const decision = isFraud(riskScore);

//     if (decision === "requiredOtp") {
//       let otp = crypto.randomInt(100000, 1000000).toString();
//       await Otp.create({ email: req.user.email, otp });

//       await mailSender(
//         req.user.email,
//         "OTP Verification",
//         `Your OTP is: ${otp}`,
//       );

//       return res.json({
//         status: "OTP_REQUIRED",
//         message: "Please verify OTP",
//         otp,
//       });
//     }

//     req.status = decision;

//     next();
//   } catch (error) {
//     console.error("Fraud Middleware Error:", error);
//     next(error);
//   }
// };

