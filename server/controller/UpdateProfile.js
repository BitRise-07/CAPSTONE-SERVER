const User = require("../model/User");
const Profile = require("../model/Profile");
const getUserFullDetails = require("../utils/getUserDetails");


const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dob, gender, address } = req.body;




    if (!address?.city) {
      return res.status(400).json({
        success: false,
        message: "City required",
      });
    }

    // SAVE PROFILE
    await Profile.findOneAndUpdate(
      { user: userId },
      { dob, gender, address },
      { upsert: true, new: true }
    );


    const fullData = await getUserFullDetails(userId);
    console.log("user data: ", fullData);
        console.log("user id: ", userId);
    console.log("User detail: ", dob, gender, address)

    return res.status(200).json({
      success: true,
      message: "Profile updated",
      redirectTo: "dashboard",
      data: fullData, 
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      nessage:"profile not updated"
    });
  }
};


const editProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      firstName,
      lastName,
      image,
      dob,
      gender,
      address,
    } = req.body;

    const user = await User.findById(userId);
    let profile = await Profile.findOne({ user: userId });

    const oldCity = profile?.address?.city;

    // USER UPDATE
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (image) user.image = image;

    // PROFILE UPDATE
    if (!profile) {
      profile = new Profile({ user: userId, dob, gender, address });
    } else {
      if (dob) profile.dob = dob;
      if (gender) profile.gender = gender;
      if (address) profile.address = address;
    }

    await profile.save();

    
    

    const fullData = await getUserFullDetails(userId);

    return res.status(200).json({
      success: true,
      message: "Profile updated",
      redirectTo: "dashboard",
      data: fullData, 
    });

  } catch {
    return res.status(500).json({ success: false });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const fullData = await getUserFullDetails(userId);

    return res.status(200).json({
      success: true,
      data: fullData,
    });

  } catch {
    return res.status(500).json({
      success: false,
    });
  }
};

module.exports = { updateProfile, editProfile, getProfile};