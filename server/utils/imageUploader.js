const cloudinary = require("cloudinary").v2;

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    try {
        if (!file || !file.tempFilePath) {
            throw new Error("File not provided or invalid");
        }

        const options = {
            folder,
            resource_type: "auto",
        };

        if (height) options.height = height;
        if (quality) options.quality = quality;

        const result = await cloudinary.uploader.upload(
            file.tempFilePath,
            options
        );

        return result;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw error; 
    }
};