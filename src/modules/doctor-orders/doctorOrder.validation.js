
const mongoose = require("mongoose");

const orderTypes = [
  "medication",
  "lab",
  "imaging",
  "procedure",
  "nursing_instruction",
  "other"
];

const priorities = ["routine", "urgent", "emergency"];

const validateCreateOrder = (req, res, next) => {
  const body = req.body || {};

  if (
    typeof body.encounterId !== "string" ||
    !mongoose.isValidObjectId(body.encounterId)
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid encounterId is required"
    });
  }

  if (!orderTypes.includes(body.orderType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order type"
    });
  }

  if (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    body.title.length > 200
  ) {
    return res.status(400).json({
      success: false,
      message: "A title of at most 200 characters is required"
    });
  }

  if (
    body.priority !== undefined &&
    !priorities.includes(body.priority)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid order priority"
    });
  }

  const allowedFields = [
    "encounterId",
    "orderType",
    "title",
    "description",
    "clinicalIndication",
    "priority",
    "effectiveFrom",
    "effectiveUntil",
    "medicationDetails",
    "investigationDetails",
    "procedureDetails",
    "instructionDetails"
  ];

  const unexpectedFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unexpectedFields.length) {
    return res.status(400).json({
      success: false,
      message: "Request contains unsupported fields",
      fields: unexpectedFields
    });
  }

  for (const field of [
    "medicationDetails",
    "investigationDetails",
    "procedureDetails",
    "instructionDetails"
  ]) {
    if (
      body[field] !== undefined &&
      (
        body[field] === null ||
        typeof body[field] !== "object" ||
        Array.isArray(body[field])
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `${field} must be an object`
      });
    }
  }

  for (const field of [
    "description",
    "clinicalIndication"
  ]) {
    if (
      body[field] !== undefined &&
      (
        typeof body[field] !== "string" ||
        body[field].length > 5000
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `${field} must be a string of at most 5000 characters`
      });
    }
  }

  next();
};

const validateOrderQuery = (req, res, next) => {
  const { encounterId, status, page = "1", limit = "10" } = req.query;

  if (
    typeof encounterId !== "string" ||
    !mongoose.isValidObjectId(encounterId)
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid encounterId query parameter is required"
    });
  }

  const allowedStatuses = [
    "draft",
    "pending_authentication",
    "active",
    "completed",
    "cancelled",
    "discontinued"
  ];

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order status"
    });
  }

  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  if (
    !Number.isInteger(parsedPage) ||
    parsedPage < 1 ||
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Page must be positive and limit must be between 1 and 100"
    });
  }

  req.pagination = {
    page: parsedPage,
    limit: parsedLimit
  };

  next();
};

const validateOrderId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID"
    });
  }

  next();
};

const validateAcknowledgement = (req, res, next) => {
  const { status, clarificationNote } = req.body || {};

  if (
    !["acknowledged", "clarification_requested"].includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid acknowledgement status is required"
    });
  }

  if (
    clarificationNote !== undefined &&
    (
      typeof clarificationNote !== "string" ||
      clarificationNote.length > 2000
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Clarification note must be at most 2000 characters"
    });
  }

  if (
    status === "clarification_requested" &&
    !clarificationNote?.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "A clarification note is required"
    });
  }

  next();
};

module.exports = {
  validateCreateOrder,
  validateOrderQuery,
  validateOrderId,
  validateAcknowledgement
};