const cloudinary = require("cloudinary").v2;
const { CLOUD_NAME, API_KEY, API_SECRET } = require("../config/env.js");

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary
 * @param {Express.Multer.File} file - multer file object
 * @param {string} folder - folder name in Cloudinary
 * @returns {Promise<string>} - secure URL of uploaded file
 */
const uploadToCloudinary = async (file, folder) => {
  try {
    if (!file || !file.buffer) throw new Error("No file buffer provided");
    console.log("Uploading file:", file.originalname, "MIME type:", file.mimetype);

    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      {
        folder,
        use_filename: false,
        overwrite: true,
        resource_type: "image",
      }
    );

    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err.message);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

module.exports = { uploadToCloudinary };
