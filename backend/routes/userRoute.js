const express = require("express");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const { getAuth } = require("@clerk/express");
const User = require("../models/UserModel");
const Group = require("../models/GroupModel");
const Message = require("../models/ChatModel");
const { protect } = require("../middleware/authMiddleware");

userRouter.post("/register", async (req, res) => {
  console.log("Registering user with data:", req.body);
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
    const users = await User.find().select("_id username email name");
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

userRouter.post("/sync-clerk-user", async (req, res) => {
  const clerkAuth = getAuth(req);
  console.log("sync auth", req.body);
  const suppliedId = req.body?.clerkUserId;
  const suppliedEmail = req.body?.email;
  const suppliedUsername = req.body?.username;

  const clerkUserId = clerkAuth?.userId || suppliedId;
  const clerkEmail =
    suppliedEmail ||
    clerkAuth?.sessionClaims?.email ||
    (clerkUserId ? `${clerkUserId}@clerk.local` : null);

  console.log("Syncing Clerk user:", {
    clerkUserId,
    clerkEmail,
    suppliedUsername,
  });

  if (!clerkUserId && !clerkEmail) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    let user = await User.findOne({ clerkId: clerkUserId }).lean();

    if (!user && clerkEmail) {
      user = await User.findOne({
        email: String(clerkEmail).toLowerCase(),
      }).lean();
    }

    if (!user) {
      const usernameBase = `clerk-${clerkUserId ? clerkUserId.slice(-6) : "user"}`;
      console.log(
        "Creating new user with username:",
        usernameBase,
        suppliedUsername,
        clerkEmail,
      );
      user = await User.create({
        clerkId: clerkUserId,
        username: usernameBase || "clerk-user",
        email: String(clerkEmail).toLowerCase(),
        password: `clerk-${clerkUserId || String(Date.now())}`,
        name: suppliedUsername || null,
      });
    } else {
      const updates = {};
      if (!user.clerkId && clerkUserId) updates.clerkId = clerkUserId;
      if (!user.email && clerkEmail)
        updates.email = String(clerkEmail).toLowerCase();
      if (!user.username)
        updates.username =
          suppliedUsername ||
          `clerk-${clerkUserId ? clerkUserId.slice(-6) : "user"}`;

      if (Object.keys(updates).length) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      }
    }

    const safeUser = {
      _id: user._id,
      username: user.username,
      name: user.name || null,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    };

    return res.json({ user: safeUser });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = userRouter;
