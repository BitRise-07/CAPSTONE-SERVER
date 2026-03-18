const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  dob: Date,
  gender: String,
  address: String,
  avatar: String,
});

module.exports = mongoose.model("Profile", profileSchema);