const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },
  accountType :{
        type: String,
        enum: ["Admin", "User",],
        required: true,
        default:"User"

    },

  phone: {
    type: String,
  },
  accountNumber: {
  type: String,
  unique: true
},

image:{
  type: String,
},

  balance: {
    type: Number,
    default: 10000,
  },
  isBlocked: {
  type: Boolean,
  default: false
},

resetPasswordToken:{
  type: String, 
},
resetPasswordExpiresIn:{
  type: Date,
},

  // raushan - yha se CreatedAt field automatically add ho jayega har user ke liye jab wo create hoga, aur updatedAt field bhi automatically update hota rahega jab bhi user document update hoga. so mai ye field hata deta hu
  
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
 