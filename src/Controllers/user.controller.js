import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import { deleteExisting, updloadFileToCloud } from "../Utils/Cloudinary.js";
import asyncHandler from "../Utils/asyncHandler.js";
import { Comment } from "../models/comments.model.js";
import { Post } from "../models/posts.model.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

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
  console.log("Request Recived");
  for (let key in req.body) {
    console.log(key + " : " + req.body[key]);
  }
  if (!username && !password) {
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
    .cookie("token", accessToken)
    .json(new ApiResponse(200, LoggedInUser, "user logged in successfully"));
});

const getProfile = asyncHandler(async (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {}, (error, info) => {
    if (error) {
      throw error;
    }
    res.json(info);
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "").json("User Logged Out");
});

const createNewPost = asyncHandler(async (req, res) => {
  const { title, summary, content } = req.body;
  const authorId = req.user?._id;

  const blogImagePath = req.file?.path;
  const blogImageUrl = await updloadFileToCloud(blogImagePath);

  if (!blogImageUrl) {
    throw new ApiError(
      500,
      "Error while occured while uploading image to cloud"
    );
  }

  const author = await User.findById(authorId);

  const createdPost = await Post.create({
    title,
    summary,
    content,
    author,
    coverImage: blogImageUrl.url,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, createdPost, "Data Printed Sucessfully"));
});

const getAllPosts = asyncHandler(async (req, res) => {
  const allposts = await Post.find()
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(10);

  if (allposts.lenght < 0) {
    return new ApiError(404, "NO posts Found");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, allposts, "All posts fetched Sucessfully"));
});

const post = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const postDoc = await Post.findById(id).populate("author", ["username"]);

  if (!postDoc) {
    throw new ApiError(404, "No post data found! ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, postDoc, "Post Fetched Successfully "));
});

const updatePost = asyncHandler(async (req, res) => {
  const { id, title, summary, content } = req.body;

  const authorId = req.user?._id;

  if ([id, title, summary, content].some((fields) => fields.trim() === "")) {
    throw new ApiError(405, "Those fields are required ");
  }

  const postDocument = await Post.findById(id);

  if (!postDocument) {
    throw new ApiError(403, "NO post found with Provided id ");
  }

  const doc = await Post.findById(id);

  const localImagePath = req.file?.path;
  let newImageurl = null;

  if (localImagePath) {
    newImageurl = await updloadFileToCloud(localImagePath);

    if (newImageurl) {
      await deleteExisting(doc.coverImage);
      // const imageId = doc.coverImage.match(/\/v\d+\/([^.\/]+)\./);
      // console.log("printing the imageId ", imageId[1]);
      // const deletedREsponse = await deleteExisting(imageId[1]);
      // console.log(deletedREsponse);
    }
  }

  await doc.updateOne({
    title,
    summary,
    content,
    coverImage: newImageurl ? newImageurl.url : doc.coverImage,
  });

  // const updatedPost = await postDocument.updateOne({
  //   title,
  //   summary,
  //   content,
  //   coverImage: newCoverImageUrl
  //     ? newCoverImageUrl?.url
  //     : postDocument?.coverImage,
  // });

  // if (!updatedPost) {
  //   new ApiError(501, "faild to update the post ");
  // }

  return res
    .status(201)
    .json(new ApiResponse(201, doc, "post is updated succssfully"));
});

// const addComment = asyncHandler(async (req, res) => {
//   const { commentContent } = req.body;
//   const authorId = req.user?._id;

//   if (!commentContent) {
//     throw new ApiError(402, "Comment Field is Required");
//   }

//   await Comment.create({
//     commentAuthor:authorId,
//     commentContent:commentContent,
//     post:
//   });
// });

export {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  createNewPost,
  getAllPosts,
  post,
  updatePost,
};
