const jwt = require("jsonwebtoken");
const { getAuth } = require("@clerk/express");
const User = require("../models/UserModel");

const protect = async (req, res, next) => {
  let token;

  const clerkAuth = getAuth(req);
  const clerkUserId = clerkAuth?.userId;
  const sessionEmail =
    clerkAuth?.sessionClaims?.email ||
    clerkAuth?.sessionClaims?.primaryEmail ||
    clerkAuth?.sessionClaims?.user?.email ||
    null;

  if (clerkUserId || sessionEmail) {
    try {
      let clerkUser = null;

      if (clerkUserId) {
        clerkUser = await User.findOne({ clerkId: clerkUserId }).lean();
      }

      if (!clerkUser && sessionEmail) {
        clerkUser = await User.findOne({
          email: String(sessionEmail).toLowerCase(),
        }).lean();
      }

      if (!clerkUser && clerkUserId) {
        clerkUser = await User.findOne({
          email: `${clerkUserId}@clerk.local`,
        }).lean();
      }

      if (!clerkUser) {
        return res.status(401).json({
          message: "User not synced yet. Please sign in again.",
        });
      }

      req.user = clerkUser;
      return next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Not authorized, clerk token failed" });
    }
  }

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

const isAdmin = (req, res, next) => {
  try {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "Not authorized as an admin" });
    }
  } catch (error) {
    res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = { protect, isAdmin };
