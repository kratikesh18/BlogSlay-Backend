import { Router } from "express";
import { upload } from "../Middlewares/multer.middleware.js";
import { verifyJwt } from "../Middlewares/auth.middleware.js";

import {
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
} from "../Controllers/user.controller.js";

import {
  addComment,
  createNewPost,
  deletePost,
  getAllPosts,
  getMyAllPosts,
  post,
  updatePost,
} from "../Controllers/post.controller.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/profile").get(verifyJwt, getProfile);
router.route("/logout").post(logoutUser);

router.route("/allposts").get(getAllPosts);
router.route("/post/:id").get(post);
router.route("/getMyPosts").get(verifyJwt, getMyAllPosts);
router.route("/addComment").post(verifyJwt, addComment);

router
  .route("/updatePost")
  .put(verifyJwt, upload.single("newBlogImage"), updatePost);

router
  .route("/createNewPost")
  .post(verifyJwt, upload.single("coverImage"), createNewPost);
// upload.fields([{ name: "blogImage", maxCount: 1 }])

router.route("/delete/:id").delete(deletePost);

export default router;
