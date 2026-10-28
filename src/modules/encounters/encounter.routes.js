
const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const authorizeRoles = require("../../middleware/role.middleware");

const {
  validateEncounterQuery,
  validateEncounterId,
  validatePatientId
} = require("./encounter.validation");

const {
  getEncounters,
  getEncounterById,
  getPatientEncounters
} = require("./encounter.controller");

const router = express.Router();

router.use(protect);

router.use(
  authorizeRoles("admin", "doctor", "nurse_in_charge", "nurse")
);

router.get("/", validateEncounterQuery, getEncounters);

router.get(
  "/patient/:patientId",
  validatePatientId,
  getPatientEncounters
);

router.get("/:id", validateEncounterId, getEncounterById);

module.exports = router;
