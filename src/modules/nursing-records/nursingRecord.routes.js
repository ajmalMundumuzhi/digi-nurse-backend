
const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const authorizeRoles = require("../../middleware/role.middleware");

const {
  validateCreateRecord,
  validateRecordQuery,
  validateRecordId
} = require("./nursingRecord.validation");

const {
  createNursingRecord,
  getNursingRecords,
  getNursingRecordById
} = require("./nursingRecord.controller");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorizeRoles("admin", "doctor", "nurse_in_charge", "nurse"),
  validateRecordQuery,
  getNursingRecords
);

router.get(
  "/:id",
  authorizeRoles("admin", "doctor", "nurse_in_charge", "nurse"),
  validateRecordId,
  getNursingRecordById
);

router.post(
  "/",
  authorizeRoles("nurse", "nurse_in_charge"),
  validateCreateRecord,
  createNursingRecord
);

module.exports = router;