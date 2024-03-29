import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    summary: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    likeCounts: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);
export const Post = mongoose.model("Post", postSchema);
