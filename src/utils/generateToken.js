
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      institutionId: user.institutionId.toString()
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h"
    }
  );
};

module.exports = generateToken;
