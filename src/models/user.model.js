import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profileCoverImage: {
    type: String,
    default:
      "https://images.pexels.com/photos/4483237/pexels-photo-4483237.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  },
  profileAvatar: {
    type: String,
    default:
      "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  },
  likedPosts: [{ type: mongoose.Types.ObjectId, ref: "Post" }],

  myComments: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],

  myPosts: [{ type: mongoose.Types.ObjectId, ref: "Post" }],
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// creating the webtoken
userSchema.methods.genrateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, username: this.username },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model("User", userSchema);
