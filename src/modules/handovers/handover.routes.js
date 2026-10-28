const express = require("express");
const router = express.Router();

const { protect } = require("../../middleware/auth.middleware");
const authorizeRoles = require("../../middleware/role.middleware");

const {
  validateCreateHandover,
  validateUpdateHandover,
  validateAcknowledgeHandover
} = require("./handover.validation");

const {
  createHandover,
  getHandovers,
  getHandoverById,
  updateHandoverDraft,
  submitHandover,
  acknowledgeHandover
} = require("./handover.controller");

router.use(protect);

router.get(
  "/",
  authorizeRoles("admin", "doctor", "nurse_in_charge", "nurse"),
  getHandovers
);

router.post(
  "/",
  authorizeRoles("nurse", "nurse_in_charge"),
  validateCreateHandover,
  createHandover
);

router.get(
  "/:id",
  authorizeRoles("admin", "doctor", "nurse_in_charge", "nurse"),
  getHandoverById
);

router.patch(
  "/:id",
  authorizeRoles("nurse", "nurse_in_charge"),
  validateUpdateHandover,
  updateHandoverDraft
);

router.post(
  "/:id/submit",
  authorizeRoles("nurse", "nurse_in_charge"),
  submitHandover
);

router.post(
  "/:id/acknowledge",
  authorizeRoles("nurse", "nurse_in_charge"),
  validateAcknowledgeHandover,
  acknowledgeHandover
);

module.exports = router;