
const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const authorizeRoles = require("../../middleware/role.middleware");

const {
  validatePatientQuery,
  validatePatientId
} = require("./patient.validation");

const {
  getPatients,
  getPatientById
} = require("./patient.controller");

const router = express.Router();

router.use(protect);

router.use(
  authorizeRoles("admin", "doctor", "nurse_in_charge", "nurse")
);

router.get("/", validatePatientQuery, getPatients);
router.get("/:id", validatePatientId, getPatientById);

module.exports = router;
