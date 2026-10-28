
const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const authorizeRoles = require("../../middleware/role.middleware");

const {
  validateCreateOrder,
  validateOrderQuery,
  validateOrderId,
  validateAcknowledgement
} = require("./doctorOrder.validation");

const {
  createDoctorOrder,
  getDoctorOrders,
  getDoctorOrderById,
  authenticateDoctorOrder,
  acknowledgeDoctorOrder
} = require("./doctorOrder.controller");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorizeRoles("admin", "doctor", "nurse_in_charge", "nurse"),
  validateOrderQuery,
  getDoctorOrders
);

router.post(
  "/",
  authorizeRoles("doctor"),
  validateCreateOrder,
  createDoctorOrder
);

router.post(
  "/:id/authenticate",
  authorizeRoles("doctor"),
  validateOrderId,
  authenticateDoctorOrder
);

router.post(
  "/:id/acknowledge",
  authorizeRoles("nurse", "nurse_in_charge"),
  validateOrderId,
  validateAcknowledgement,
  acknowledgeDoctorOrder
);

router.get(
  "/:id",
  authorizeRoles("admin", "doctor", "nurse_in_charge", "nurse"),
  validateOrderId,
  getDoctorOrderById
);

module.exports = router;