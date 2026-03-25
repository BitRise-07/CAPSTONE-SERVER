const User = require("../model/User");
const Profile = require("../model/Profile");


const getUserFullDetails = async (userId) => {
  const user = await User.findById(userId).select(
    "-password -resetPasswordToken -resetPasswordExpiresIn"
  );

  const profile = await Profile.findOne({ user: userId });

  return {
    ...user.toObject(),
    profile,
  };
};

module.exports = getUserFullDetails;