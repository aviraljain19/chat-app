const jwt = require("jsonwebtoken");
const { getAuth } = require("@clerk/express");
const User = require("../models/UserModel");

const protect = async (req, res, next) => {
  let token;

  const clerkAuth = getAuth(req);
  const clerkUserId = clerkAuth?.userId;

  if (clerkUserId) {
    try {
      const clerkUser = await User.findOne({
        email: `${clerkUserId}@clerk.local`,
      });
      if (clerkUser) {
        req.user = clerkUser;
        return next();
      }

      const fallbackUser = await User.findOne({
        email: clerkAuth?.sessionClaims?.email,
      });
      if (fallbackUser) {
        req.user = fallbackUser;
        return next();
      }

      const createdUser = await User.create({
        username:
          clerkAuth.sessionClaims?.username || `clerk-${clerkUserId.slice(-6)}`,
        email: `${clerkUserId}@clerk.local`,
        password: `clerk-${clerkUserId}`,
      });

      req.user = createdUser;
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
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
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
