require("dotenv").config();


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