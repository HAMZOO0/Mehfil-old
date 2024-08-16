import User from "../models/user.model.js";
// import {  } from "../middleware/authentication.middleware.js";
import cookie from "cookie-parser";
import { API_Error_handler } from "../utils/api_error_handler.js";
import { API_Responce } from "../utils/api_responce.js";
import asyncHandler from "express-async-handler";
import { cloudinary_file_upload } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { genrate_access_and_refresh_token } from "../utils/genrate_token.js";
import {} from "../middleware/authentication.middleware.js";
const register_user = asyncHandler(async (req, res) => {
  //TODO
  /*
   * get data from req.body
   * validate the data  (!empty)
   * check is this already exist
   * get avatar from req.file and validate
   * uplaod avatar on cloudinary
   * create user in db and upload all data
   * remove password and toekn form responce
   */
  const { user_name, Full_name, Email, password } = req.body;
  const avatar = req.file?.path;
  //   const avatar_local_path = req.files?.avatar?.[0]?.path;

  if (!user_name || !Full_name || !Email || !password || !avatar) {
    throw new API_Error_handler(400, "All feilds are required ");
  }

  const user_check = await User.find({ user_name, Email });
  if (!user_check) {
    throw new API_Error_handler(409, "User already exist change Name or Email");
  }
  const cloudinary_avatar = await cloudinary_file_upload(avatar);
  if (!cloudinary_avatar) {
    throw new API_Error_handler(400, "Avatar File is required ");
  }
  console.log("cloudinary_avatar.fileId", cloudinary_avatar.public_id);
  console.log("cloudinary_avatar.url", cloudinary_avatar.url);

  const user = await User.create({
    user_name,
    Full_name,
    Email,
    password,
    avatar: {
      field_id: cloudinary_avatar.public_id,
      url: cloudinary_avatar.url,
    },
  });

  const created_user = await User.findById(user._id).select(
    "-password -refresh_token "
  );

  if (!created_user) {
    throw new API_Error_handler(
      500,
      "Something is went wrong while creating user obejct "
    );
  }
  return res
    .status(200)
    .json(new API_Responce(200, created_user, "User registered Successfully"));
});

const login_user = asyncHandler(async (req, res) => {
  // Todo
  /*
   * req.body (pass , email)
   * verifi  - pass decpyt
   * tokens genrate
   * send respeonce with cookies
   */

  const { Email, password } = req.body;
  if (!Email || !password) {
    throw new API_Error_handler(404, "Email and Password required");
  }

  const user = await User.findOne({ Email });

  if (!user) {
    throw new API_Error_handler(404, "invalid Email - User not found  ");
  }

  const passowrd_check = await user.is_password_currect(password);

  if (!passowrd_check) {
    throw new API_Error_handler(401, "Re-check your password");
  }

  const { refresh_token, access_token } =
    await genrate_access_and_refresh_token(user._id);

  const logged_in_user = await User.findById(user._id).select(
    "-password -refresh_token"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("access_token", access_token, option)
    .cookie("refresh_token", refresh_token, option)
    .json(
      new API_Responce(
        200,
        {
          user,
          "Access Token": access_token,
          "Refresh Token": refresh_token,
        },
        "User login successfully"
      )
    );
});

const logout_user = asyncHandler(async (req, res) => {
  // TODO
  // 1: remove refresh token
  // 2: remove access token
  // 3: send res

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: { refresh_token: "" },
    },
    { new: true } // Return the updated document after the update.
  );

  return res
    .status(200)
    .clearCookie("access_token")
    .clearCookie("refresh_token")
    .json(new API_Responce(200, null, "User logout successfully"));

  return res.status(200).json(new API_Responce(200, "Logout successfully"));
});

const refresh_Access_token = asyncHandler(async (req, res) => {
  const token =
    req.cookies?.refresh_token ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new API_Error_handler(400, "invalid requst ");
  }

  const user = await User.find({ refresh_token: token });

  if (!user) {
    throw new API_Error_handler(404, "User not found ");
  }

  const { refresh_token, access_token } =
    await genrate_access_and_refresh_token(user._id);

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("access_token", access_token, option)
    .cookie("refresh_token", refresh_token, option)
    .json(
      new API_Responce(
        200,
        {
          "Access Token": access_token,
          "Refresh Token": refresh_token,
        },
        "Token refresh successfully "
      )
    );
});

const change_password = asyncHandler(async (req, res) => {
  const { oldpassword, password } = req.body;

  if (!password || !oldpassword) {
    throw new API_Error_handler(400, "Old and New password required");
  }

  const user = await User.findById(req.user?._id);

  const password_verification = user.is_password_currect(oldpassword);
  if (!password_verification) {
    throw new API_Error_handler(400, "Old not currect");
  }

  user.password = password;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new API_Responce(200, {}, "Password changed successfully "));
});

const get_current_user = asyncHandler(async (req, res, next) => {
  return res
    .status(200)
    .json(
      new API_Responce(200, req.user, "Current user feteched successfully")
    );
});

const update_account_details = asyncHandler(async (req, res) => {
  const { user_name, Email, links, bio } = req.body;

  if (!user_name && !Email && !links && !bio) {
    throw new API_Error_handler(400, "nothing to update");
  }

  const user = await User.findById(req.user?._id).select(
    "-password -refresh_token"
  );

  if (user_name) {
    user.user_name = user_name;
  }

  if (Email) {
    user.Email = Email;
  }

  if (links) {
    user.links = links;
  }

  if (bio) {
    user.bio = bio;
  }

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new API_Responce(200, user, "Account details updated successfully"));
});

export {
  register_user,
  login_user,
  logout_user,
  refresh_Access_token,
  change_password,
  get_current_user,
  update_account_details,
};
