const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  // ✅ 1. IZINKAN PREFLIGHT CORS
  if (req.method === "OPTIONS") {
    return next();
  }

  let token;

  // ✅ 2. AMBIL TOKEN DARI COOKIE (BUKAN HEADER)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as admin" });
  }
};

module.exports = { protect, admin };
