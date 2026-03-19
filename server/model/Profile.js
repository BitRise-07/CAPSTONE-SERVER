const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  dob: Date,
  gender: String,
  address: {
    current: String,
    permanent: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  avatar: String,
}, { timestamps: true });

module.exports = mongoose.model("Profile", profileSchema);