const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("DB connected successfully");
    } catch (error) {
        console.log("DB connection failed");
        console.error(error);
        process.exit(1);
    }
};