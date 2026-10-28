
const express = require("express");
const {
  login,
  getMe
} = require("./auth.controller");
const {
  validateLogin
} = require("./auth.validation");
const { protect } = require("../../middleware/auth.middleware");

const router = express.Router();

router.post("/login", validateLogin, login);
router.get("/me", protect, getMe);

module.exports = router;
