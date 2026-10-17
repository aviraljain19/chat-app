const express = require("express");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const Group = require("../models/GroupModel");
const Message = require("../models/ChatModel");
const { protect } = require("../middleware/authMiddleware");

userRouter.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ username, email, password });
    if (user) {
      res
        .status(201)
        .json({ _id: user._id, username: user.username, email: user.email });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json({
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

userRouter.get("/", protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("_id username email")
      .sort({ username: 1 });
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

userRouter.get("/allUsers", protect, async (req, res) => {
  console.log("Fetching all users");
  try {
    const users = await User.find().select("_id username email");
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = userRouter;
