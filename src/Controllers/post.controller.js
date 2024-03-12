import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import { deleteExisting, updloadFileToCloud } from "../Utils/Cloudinary.js";
import asyncHandler from "../Utils/asyncHandler.js";
import { Comment } from "../models/comments.model.js";
import { Post } from "../models/posts.model.js";
import { User } from "../models/user.model.js";

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

const getMyAllPosts = asyncHandler(async (req, res) => {
  const authorId = req.user?._id;

  const allMyPosts = await Post.find({
    author: authorId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, allMyPosts, "all posts fetched"));
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
  // .populate("comments" );

  // findig the comments which is linked to the post

  const comments = await Comment.find({ post: id })
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .select("-post");
  // console.log("printing comments ", comments);
  postDoc.comments = comments;

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
    }
  }

  await doc.updateOne({
    title,
    summary,
    content,
    coverImage: newImageurl ? newImageurl.url : doc.coverImage,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, doc, "post is updated succssfully"));
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Post id not found");
  }

  const postToDelete = await Post.findById(id);
  if (!postToDelete) {
    throw new ApiError(400, "Post not found");
  }

  const { coverImage } = postToDelete;
  deleteExisting(coverImage);

  const resp = await Post.deleteOne(postToDelete._id);

  if (!resp.deletedCount == 1) {
    throw new ApiError(500, "Error while deleting the post ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, resp, "Post Deleted Successfully"));
});

// not in production code
const addComment = asyncHandler(async (req, res) => {
  const { comment, id } = req.body;
  console.log("comment is : ", comment);
  console.log("post id is : ", id);
  const authorId = req.user?._id;

  if (!comment || !id) {
    throw new ApiError(400, "those fields are required");
  }

  const createdComment = await Comment.create({
    text: comment,
    author: authorId,
    post: id,
  });

  try {
    // update the post by the comment
    await Post.findByIdAndUpdate(id, {
      $push: { comments: createdComment },
    });

    await User.findByIdAndUpdate(authorId, {
      $push: { myComments: createdComment._id },
    });
  } catch (error) {
    throw new ApiError(400, error.message);
  }
  console.log(createdComment);
  return res
    .status(200)
    .json(new ApiResponse(200, createdComment, "comment posted successfullly"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.body;
  const userId = req.user?._id;

  if (!commentId) {
    throw new ApiError(400, "CommentId  not found");
  }

  const commentToDelete = await Comment.findById(commentId);

  const { post } = commentToDelete;

  const postToUpdate = await Post.findByIdAndUpdate(post, {
    $pull: { comments: commentId },
  });

  await User.findByIdAndUpdate(userId, {
    $pull: { myComments: commentId },
  });

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));
});

const increaseLikes = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const viewerId = req.user?._id;

  if (!id || !viewerId) {
    return new ApiError(400, "No post id or userid found");
  }

  try {
    await Post.findByIdAndUpdate(id, {
      $addToSet: { likeCounts: viewerId },
    });
    await User.findByIdAndUpdate(viewerId, {
      $addToSet: { likedPosts: id },
    });
  } catch (error) {
    throw new ApiError(400, error.message);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { message: "post liked" }, "post liked successfully")
    );
});

const removeLike = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const viewerId = req.user?._id;

  if (!id) {
    throw new ApiError(400, "No PostId found");
  }
  try {
    await Post.findByIdAndUpdate(id, {
      $pull: { likeCounts: viewerId },
    });
    await User.findByIdAndUpdate(viewerId, {
      $pull: { likedPosts: id },
    });
  } catch (error) {
    throw new ApiError(400, error.message);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { message: "liked removed" },
        "like removed successfully"
      )
    );
});

export {
  updatePost,
  createNewPost,
  post,
  getAllPosts,
  getMyAllPosts,
  deletePost,
  addComment,
  increaseLikes,
  removeLike,
  deleteComment,
};

// ************* GARBAGE *********//
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
