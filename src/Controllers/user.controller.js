import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import asyncHandler from "../Utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { deleteExisting, updloadFileToCloud } from "../Utils/Cloudinary.js";
import { Post } from "../models/posts.model.js";
import { Comment } from "../models/comments.model.js";
import { post } from "./post.controller.js";

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
    throw new ApiError(406, "User not found Kindly Register");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(405, "Enter Valid Password");
  }

  const LoggedInUser = await User.findById(user._id).select("-password");

  const accessToken = await user.genrateAccessToken();

  return res
    .status(200)
    .cookie("token", accessToken, {
      expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
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

  const avatarImagePath = req?.files?.avatar[0].path;
  const coverImagePath = req?.files?.coverImage[0].path;

  console.log(avatarImagePath, coverImagePath);

  if (!email && !username && !avatarImagePath && !coverImagePath) {
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { data: "no updation found" },
          "proile not updated "
        )
      );
  }

  const userprofileToUpdate = await User.findById(userid);

  if (!userprofileToUpdate) {
    throw new ApiError(400, "No user found");
  }

  const { profileCoverImage, profileAvatar } = userprofileToUpdate;

  const newCoverImageUrl = await updloadFileToCloud(coverImagePath);
  const newAvatarImageUrl = await updloadFileToCloud(avatarImagePath);

  if (!newCoverImageUrl || !newAvatarImageUrl) {
    throw new ApiError(500, "error while uploading files to cloud");
  }

  if (profileCoverImage || profileAvatar) {
    await deleteExisting(profileCoverImage);
    await deleteExisting(profileAvatar);
  }

  try {
    await userprofileToUpdate.updateOne({
      username: username,
      email: email,
      profileCoverImage: newCoverImageUrl?.url,
      profileAvatar: newAvatarImageUrl?.url,
    });
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

export {
  updateUserInfo,
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  getUserProfile,
  getLikedPosts,
  getUserComments,
};
