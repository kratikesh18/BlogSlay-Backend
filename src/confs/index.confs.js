import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const confs = {
  cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryAPI: process.env.CLOUDINARY_API_KEY,
  cloudinarySecret: process.env.CLOUDINARY_API_SECRET,
  coresOrigin: process.env.CORS_ORIGIN,
};

export default confs;
