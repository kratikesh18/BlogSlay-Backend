import { Router } from "express";
import { upload } from "../Middlewares/multer.middleware.js";
import { verifyJwt } from "../Middlewares/auth.middleware.js";

import {
  changePassword,
  getLikedPosts,
  getProfile,
  getUserComments,
  getUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  sendForgotMail,
  updateUserInfo,
} from "../Controllers/user.controller.js";

import {
  addComment,
  createNewPost,
  deleteComment,
  deletePost,
  getAllPosts,
  getMyAllPosts,
  increaseLikes,
  post,
  removeLike,
  updatePost,
} from "../Controllers/post.controller.js";

const router = Router();

// user routers
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/profile").get(verifyJwt, getProfile);
router.route("/logout").post(logoutUser);
router.route("/userprofile").get(verifyJwt, getUserProfile);
router.route("/likedposts").get(verifyJwt, getLikedPosts);
router.route("/usercomments").get(verifyJwt, getUserComments);
router.route("/updateuserinfo").patch(
  verifyJwt,
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  updateUserInfo
);

// post routers
router.route("/allposts").get(getAllPosts);
router.route("/post/:id").get(post);

router.route("/getMyPosts").get(verifyJwt, getMyAllPosts);
router.route("/addComment").post(verifyJwt, addComment);
router.route("/addlike").post(verifyJwt, increaseLikes);
router.route("/removelike").delete(verifyJwt, removeLike);
router.route("/deletecomment").delete(verifyJwt, deleteComment);
router.route("/changepassword").patch(verifyJwt, changePassword);


router
  .route("/updatePost")
  .put(verifyJwt, upload.single("newBlogImage"), updatePost);

router
  .route("/createNewPost")
  .post(verifyJwt, upload.single("coverImage"), createNewPost);
// upload.fields([{ name: "blogImage", maxCount: 1 }])

router.route("/delete/:id").delete(deletePost);
router.route("/sendmail").post(sendForgotMail);
export default router;
