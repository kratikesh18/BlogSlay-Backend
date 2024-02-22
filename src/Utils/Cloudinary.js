import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import confs from "../confs/index.confs.js";

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// }

cloudinary.config({
  cloud_name: confs.cloudinaryName,
  api_key: confs.cloudinaryAPI,
  api_secret: confs.cloudinarySecret,
  secure: true,
});

// updloading the file to the cloudinary
const updloadFileToCloud = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file is uploaded to the cloudinary
    console.log("file is uploaded ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("returning null from here", error?.message);
    return null;
  }
};

// cloudinary.v2.api.delete_resources(public_ids, options).then(callback);
// cloudinary.v2.api
//   .delete_resources(['ch8p2kvyukstl2hfvkyy'],
//     { type: 'upload', resource_type: 'image' })
//   .then(console.log);

const deleteExisting = async (previousImgUrl) => {
  try {
    // const imageId = doc.coverImage.match();
    // console.log("printing the imageId ", imageId[1]);
    // const deletedREsponse = await deleteExisting(imageId[1]);

    const regEx = /\/v\d+\/([^.\/]+)\./;
    const prevImgId = previousImgUrl.match(regEx);
    const previousId = prevImgId[1];
    cloudinary.api
      .delete_resources([previousId], {
        type: "upload",
        resource_type: "image",
      })
      .then(console.log("File is deleted"));
  } catch (error) {
    console.log(error.message);
  }
};
// exporting the uploadfile function
export { updloadFileToCloud, deleteExisting };
