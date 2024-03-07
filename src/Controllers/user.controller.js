import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import asyncHandler from "../Utils/asyncHandler.js";
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
    .cookie("token", accessToken)
    .json(new ApiResponse(200, LoggedInUser, "user logged in successfully"));
});

const getProfile = asyncHandler(async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    throw new ApiError(403, "Must have to login to access the page");
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {}, (error, info) => {
    if (error) {
      throw new ApiError(400, error.message);
    }
    return res
      .status(200)
      .json(new ApiResponse(200, info, "Profile fetchdd successfully "));
  });
});


const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  return res
    .status(200)
    .json(new ApiResponse(200, { succcess: "user logged out " }));
});



export { registerUser, loginUser, getProfile, logoutUser };
