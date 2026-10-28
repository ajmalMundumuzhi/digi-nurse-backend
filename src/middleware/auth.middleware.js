
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  const token = authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is missing"
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token"
    });
  }

  if (!decoded.userId || !decoded.institutionId) {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token"
    });
  }

  const user = await User.findOne({
    _id: decoded.userId,
    institutionId: decoded.institutionId,
    status: "active"
  }).select("-passwordHash");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Staff account is inactive or no longer available"
    });
  }

  req.user = user;

  next();
});

module.exports = { protect };
