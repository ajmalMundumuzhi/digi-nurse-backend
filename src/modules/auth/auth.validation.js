
const validateLogin = (req, res, next) => {
  const { staffId, password } = req.body || {};

  if (
    typeof staffId !== "string" ||
    typeof password !== "string" ||
    !staffId.trim() ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Staff ID and password are required"
    });
  }

  if (staffId.trim().length > 100 || password.length > 128) {
    return res.status(400).json({
      success: false,
      message: "Invalid staff ID or password"
    });
  }

  req.body.staffId = staffId.trim();
  next();
};

module.exports = { validateLogin };
