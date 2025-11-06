const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/convertToBase64");
const User = require("../models/User");

const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");


router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const { email, username, password, newsletter } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: "Missing Variable" });
    }

    const emailExists = await User.findOne({ email: email });
    if (emailExists) {
      return res
        .status(409)
        .json({ message: "Email exists, please go to Sign-In" });
    }

    const salt = uid2(16);
    const token = uid2(64);
    const hash = SHA256(password + salt).toString(encBase64);
    const newUser = new User({
      email,
      account: {
        username,
      },
      newsletter: newsletter,
      token,
      salt,
      hash,
    });

    if (req.files && req.files.avatar) {
      const avatarUpload = await cloudinary.uploader.upload(
        convertToBase64(req.files.avatar),
        { folder: `vinted/users/${username}` }
      );

      newUser.account.avatar = {
        secure_url: avatarUpload.secure_url,
        public_id: avatarUpload.public_id,
      };
    }

    await newUser.save();
    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
        avatar: newUser.account.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const findUser = await User.findOne({ email });
    if (!findUser) {
      return res
        .status(404)
        .json({ message: "Email or password is incorrect" });
    }

    const hashKey = SHA256(password + findUser.salt).toString(encBase64);
    if (hashKey !== findUser.hash) {
      return res.status(401).json({ message: "email or Password is incorrect" });
    }

    res.status(200).json({
      _id: findUser._id,
      token: findUser.token,
      account: {
        username: findUser.account.username,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
