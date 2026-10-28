const bcrypt = require("bcryptjs");
const asyncHandler = require("../../utils/asyncHandler");
const generateToken = require("../../utils/generateToken");
const User = require("../../models/User");
const Institution = require("../../models/Institution");

const login = asyncHandler(async (req, res) => {
  const { staffId, password, institutionCode } = req.body;

  if (
    typeof institutionCode !== "string" ||
    !institutionCode.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Institution code is required"
    });
  }

  const institution = await Institution.findOne({
    code: institutionCode.trim().toUpperCase(),
    status: "active"
  }).select("_id");

  if (!institution) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }

  const user = await User.findOne({
    institutionId: institution._id,
    staffId,
    status: "active"
  }).select("+passwordHash");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }

  const token = generateToken(user);

  user.lastLoginAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      institutionId: user.institutionId,
      staffId: user.staffId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation
    }
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      institutionId: user.institutionId,
      staffId: user.staffId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      wardIds: user.wardIds,
      lastLoginAt: user.lastLoginAt
    }
  });
});

module.exports = {
  login,
  getMe
};
