import { Router } from "express";
import {
  createNewPost,
  getAllPosts,
  getProfile,
  loginUser,
  logoutUser,
  post,
  registerUser,
  updatePost,
} from "../Controllers/user.controller.js";

import { upload } from "../Middlewares/multer.middleware.js";
import { verifyJwt } from "../Middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/profile").get(getProfile);
router.route("/logout").post(logoutUser);
router.route("/allposts").get(getAllPosts);
router.route("/post/:id").get(post);

router
  .route("/updatePost")
  .put(verifyJwt, upload.single("newBlogImage"), updatePost);

router
  .route("/createNewPost")
  .post(verifyJwt, upload.single("coverImage"), createNewPost);
// upload.fields([{ name: "blogImage", maxCount: 1 }])
export default router;
