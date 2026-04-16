const Otp = require("../model/Otp");

exports.verifyTransaction = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }
    const record = await Otp.findOne({ email: req.user.email, otp }, {sort: { createdAt: -1 }});
    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    req.status = "success";
    await Otp.deleteOne({ _id: record._id });
    next();
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

