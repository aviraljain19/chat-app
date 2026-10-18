const express = require("express");
const userRouter = express.Router();
const jwt = require("jsonwebtoken");
const { createClerkClient } = require("@clerk/clerk-sdk-node");
const User = require("../models/UserModel");
const { protect } = require("../middleware/authMiddleware");

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

userRouter.post("/clerk-session", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const clerkToken = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";

  if (!clerkToken) {
    return res.status(401).json({ message: "Missing Clerk token" });
  }

  try {
    const claims = await clerkClient.verifyToken(clerkToken);
    const clerkUserId = claims.sub;

    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const primaryEmail =
      clerkUser.emailAddresses?.find(
        (email) => email.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress ||
      "";

    if (!primaryEmail) {
      return res.status(400).json({ message: "Verified email is required" });
    }

    let dbUser = await User.findOne({ email: primaryEmail.toLowerCase() });

    if (!dbUser) {
      const usernameBase = (
        clerkUser.firstName ||
        clerkUser.username ||
        "clerk-user"
      )
        .toString()
        .trim();

      const baseName = usernameBase || "clerk-user";
      let username = baseName;
      let suffix = 1;

      while (await User.findOne({ username })) {
        username = `${baseName}${suffix}`;
        suffix += 1;
      }

      dbUser = await User.create({
        username,
        email: primaryEmail.toLowerCase(),
        password: null,
        authProvider: "clerk",
        clerkUserId,
      });
    } else {
      dbUser.clerkUserId = clerkUserId;
      dbUser.authProvider = "clerk";
      dbUser.username = dbUser.username || clerkUser.username || "clerk-user";
      await dbUser.save();
    }

    const appToken = generateToken(dbUser._id);

    return res.json({
      user: {
        _id: dbUser._id,
        username: dbUser.username,
        email: dbUser.email,
        isAdmin: dbUser.isAdmin,
        token: appToken,
      },
    });
  } catch (error) {
    console.error("Clerk session invalid:", error);
    return res
      .status(401)
      .json({ message: "Invalid or expired Google session" });
  }
});

userRouter.get("/allUsers", protect, async (req, res) => {
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
