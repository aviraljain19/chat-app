const express = require("express");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const { getAuth } = require("@clerk/express");
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

userRouter.post("/sync-clerk-user", async (req, res) => {
  const clerkAuth = getAuth(req);
  const suppliedId = req.body?.clerkUserId;
  const suppliedEmail = req.body?.email;
  const suppliedUsername = req.body?.username;

  const clerkUserId = clerkAuth?.userId || suppliedId;
  const clerkEmail =
    suppliedEmail ||
    clerkAuth?.sessionClaims?.email ||
    (clerkUserId ? `${clerkUserId}@clerk.local` : null);

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
      const usernameBase =
        suppliedUsername ||
        clerkAuth?.sessionClaims?.firstName ||
        clerkAuth?.sessionClaims?.username ||
        `clerk-${clerkUserId ? clerkUserId.slice(-6) : "user"}`;

      user = await User.create({
        clerkId: clerkUserId,
        username: usernameBase || "clerk-user",
        email: String(clerkEmail).toLowerCase(),
        password: `clerk-${clerkUserId || String(Date.now())}`,
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

// Update profile (first-time username selection)
userRouter.patch('/profile', async (req, res) => {
  const { username } = req.body;
  if (!username || !String(username).trim()) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    const clerkAuth = getAuth(req);
    const clerkUserId = clerkAuth?.userId;

    let user = null;

    if (clerkUserId) {
      user = await User.findOne({ clerkId: clerkUserId });
      if (!user && clerkAuth?.sessionClaims?.email) {
        user = await User.findOne({ email: clerkAuth.sessionClaims.email.toLowerCase() });
      }
    }

    // Fallback to JWT if Clerk session not present
    if (!user && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id);
      } catch (err) {
        // ignore, will handle below
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Ensure username is unique (case-insensitive)
    const existing = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
    if (existing && String(existing._id) !== String(user._id)) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    user.username = String(username).trim();
    await user.save();

    const safeUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    };

    return res.json({ user: safeUser });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

