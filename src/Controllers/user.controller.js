import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import asyncHandler from "../Utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { deleteExisting, updloadFileToCloud } from "../Utils/Cloudinary.js";
import { Post } from "../models/posts.model.js";
import { Comment } from "../models/comments.model.js";
import { transporter } from "../Utils/Nodemailer.js";

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if ([email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "The above Fields cannnot be empty! ");
  }

  const userDoExist = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (userDoExist) {
    throw new ApiError(
      406,
      "User with this Email or username is already exist "
    );
  }

  const user = await User.create({
    email: email,
    password: password,
    username: username,
  });

  const userToSend = await User.findById(user._id).select("-password");
  const accessToken = await user.genrateAccessToken();

  return res
    .status(200)
    .cookie("token", accessToken)
    .json(new ApiResponse(200, userToSend, "user created successfully "));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  for (let key in req.body) {
    console.log(key + " : " + req.body[key]);
  }

  if (!username.trim() && !password.trim()) {
    throw new ApiError(403, "Creadentials Required");
  }

  const user = await User.findOne({ username });

  if (!user) {
    throw new ApiError(406, "User not found 🫤");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(405, "Enter Valid Password");
  }

  const LoggedInUser = await User.findById(user._id).select("-password");

  const accessToken = await user.genrateAccessToken();

  console.log("\tUser found & logged In successfully!");
  return res
    .status(200)
    .cookie("token", accessToken, {
      expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      HttpOnly: true,
      secure: true,
    })
    .json(new ApiResponse(200, LoggedInUser, "user logged in successfully"));
});

const getProfile = asyncHandler(async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    throw new ApiError(403, "Must have to login to access the page");
  }
  //we created the verify jwt middleware for the below task
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {}, (error, info) => {
    if (error) {
      throw new ApiError(400, error.message);
    }
    return res
      .status(200)
      .json(new ApiResponse(200, info, "Profile fetchdd successfully "));
  });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Verification token not found");
  }

  const userProfileDoc = await User.findById(userId).select("-password  -__v");

  if (!userProfileDoc) {
    throw new ApiError(400, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userProfileDoc, "Profile data fetched successfully")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  return res
    .status(200)
    .json(new ApiResponse(200, { succcess: "user logged out " }));
});

const updateUserInfo = asyncHandler(async (req, res) => {
  const { email, username } = req.body;
  const userid = req.user?._id;

  if (
    !email &&
    !username &&
    (!req.files || Object.keys(req.files).length === 0)
  ) {
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { data: "no updation found" },
          "profile not updated"
        )
      );
  }

  const userprofileToUpdate = await User.findById(userid);

  if (!userprofileToUpdate) {
    throw new ApiError(400, "No user found");
  }

  const updates = {};
  if (email) updates.email = email;
  if (username) updates.username = username;

  if (req.files) {
    const { avatar, coverImage } = req.files;
    if (avatar && avatar.length > 0) {
      const avatarUrl = await updloadFileToCloud(avatar[0].path);
      if (userprofileToUpdate.profileAvatar)
        await deleteExisting(userprofileToUpdate.profileAvatar);
      updates.profileAvatar = avatarUrl.secure_url; // Assuming `avatarUrl` is an object with `secure_url` property
    }
    if (coverImage && coverImage.length > 0) {
      const coverImageUrl = await updloadFileToCloud(coverImage[0].path);
      if (userprofileToUpdate.profileCoverImage)
        await deleteExisting(userprofileToUpdate.profileCoverImage);
      updates.profileCoverImage = coverImageUrl.secure_url; // Assuming `coverImageUrl` is an object with `secure_url` property
    }
  }

  try {
    await userprofileToUpdate.updateOne(updates);
  } catch (error) {
    throw new ApiError(500, error.message);
  }

  const userToSend = await User.findById(userid);

  return res
    .status(200)
    .json(new ApiResponse(200, userToSend, "User Updated Successfully"));
});

const getLikedPosts = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const likedPosts = await Post.find({
    likeCounts: { $in: [userId] },
  }).populate("author", ["username"]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedPosts, "all liked posts fetched sucessfully")
    );
});

const getUserComments = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "NO user id found");
  }

  const comments = await Comment.find({ author: userId })
    .sort({ createdAt: -1 })
    .populate("post", ["coverImage"]);
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments fetched successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, reEnteredPassword } = req.body;
  const userId = req.user?._id ;

  if (!currentPassword || !newPassword || !reEnteredPassword) {
    throw new ApiError(400, "Enter required fields");
  }

  // check if the both new passwords are equal(same)
  if (newPassword !== reEnteredPassword) {
    throw new ApiError(400, "Re-entered passwords doesn't match");
  }

  //finding the userinfo
  const userToUpdate = await User.findById(userId);

  if (!userToUpdate) {
    throw new ApiError(400, "User doesn't exist");
  }
  // check if the currentpassword is equal to the dbpassword using isPasswordCorrect method
  const isPasswordValid = await userToUpdate.isPasswordCorrect(currentPassword);

  if (!isPasswordValid) {
    throw new ApiError(405, "current password is incorrect");
  }

  // if code reaches here that means enterd password is correct
  userToUpdate.password = newPassword;

  const passwordUpdation = await userToUpdate.save({
    validateBeforeSave: false,
  });
  if (!passwordUpdation) {
    return res
      .status(500)
      .json(new ApiResponse(400, "internal server error, Try Again"));
  }

  //returning the final result
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Updated Successfully "));
});

const sendForgotMail = asyncHandler(async (req, res) => {
  try {
    const info = await transporter.sendMail({
      from: '"support team Blogslay" <noreplay@blogslay.support>', // sender address
      to: "mr.kartikesh@gmail.com", // list of receivers
      subject: "Reset your parssword", // Subject line
      text: "", // plain text body
      html: "<h1>Hey user</h1><p>this is the code for resetting your password : 103134</p> ", // html body
    });
    return res
      .status(200)
      .json(new ApiResponse(200, { info }, "email sent successfully"));
  } catch (error) {
    return res
      .status(400)
      .json(new ApiResponse(400, { error }, "failed so send email"));
  }
});
export {
  updateUserInfo,
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  getUserProfile,
  getLikedPosts,
  getUserComments,
  sendForgotMail,
  changePassword,
};



//*********** Garbage ***********  *//


// const updateUserInfo = asyncHandler(async (req, res) => {
//   //extracting the username and email and getting  the userid
//   const { email, username } = req.body;
//   const userid = req.user?._id;

//   // getting the files for updation
//   const avatarImagePath = req?.files?.avatar[0].path;
//   const coverImagePath = req?.files?.coverImage[0].path;

//   console.log(avatarImagePath, coverImagePath);

//   // if theree is not updateion we are sending response to nothing
//   if (!email && !username && !avatarImagePath && !coverImagePath) {
//     return res
//       .status(201)
//       .json(
//         new ApiResponse(
//           201,
//           { data: "no updation found" },
//           "proile not updated "
//         )
//       );
//   }

//   // now we have updation thats why we are finding the user
//   const userprofileToUpdate = await User.findById(userid);

//   if (!userprofileToUpdate) {
//     throw new ApiError(400, "No user found");
//   }

//   // getting the existing urls of the photos
//   const { profileCoverImage, profileAvatar } = userprofileToUpdate;

//   // we have new photos to upload so we are uploading and getting the url
//   const newCoverImageUrl = await updloadFileToCloud(coverImagePath);
//   const newAvatarImageUrl = await updloadFileToCloud(avatarImagePath);

//   //handling url
//   if (!newCoverImageUrl || !newAvatarImageUrl) {
//     throw new ApiError(500, "error while uploading files to cloud");
//   }

//   // deleting the existing the if they exist
//   if (profileCoverImage) {
//     await deleteExisting(profileCoverImage);
//   }
//   if (profileAvatar) {
//     await deleteExisting(profileAvatar);
//   }

//   // updating the userProfileToUpdate
//   try {
//     await userprofileToUpdate.updateOne({
//       username: username,
//       email: email,
//       profileCoverImage: newCoverImageUrl?.url,
//       profileAvatar: newAvatarImageUrl?.url,
//     });
//   } catch (error) {
//     throw new ApiError(500, error.message);
//   }

//   const userToSend = await User.findById(userid);

//   return res
//     .status(200)
//     .json(new ApiResponse(200, userToSend, "User Updated Successfully"));
// });

// Not mine code
