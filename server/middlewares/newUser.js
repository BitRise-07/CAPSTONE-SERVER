const User = require("../models/User");
const Transaction = require("../model/Transaction")

const newUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    const isNewByTime =
      (Date.now() - new Date(user.createdAt)) < 24 * 60 * 60 * 1000;

    const txnCount = await Transaction.countDocuments({
      sender: userId,
    });

    const isNewByTxn = txnCount < 3;


    if (isNewByTime || isNewByTxn ) {
      req.isNewUser = true;
    } else {
      req.isNewUser = false;
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error in new user check" });
  }
};

module.exports = newUser;