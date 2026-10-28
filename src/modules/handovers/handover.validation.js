const mongoose = require("mongoose");

const isObjectId = (value) => mongoose.isValidObjectId(value);

const isString = (value) => typeof value === "string";

const isNonEmptyString = (value) =>
  isString(value) && value.trim().length > 0;

const isValidDate = (value) =>
  !Number.isNaN(new Date(value).getTime());

const validShiftTypes = ["morning", "evening", "night"];
const validPriorities = ["routine", "urgent", "emergency"];
const validSourceTypes = [
  "doctor_order",
  "care_plan",
  "nursing_record",
  "other"
];

const validateCreateHandover = (req, res, next) => {
  const { encounterId, fromShift, toShift } = req.body;

  if (!isObjectId(encounterId)) {
    return res.status(400).json({
      success: false,
      message: "A valid encounterId is required"
    });
  }

  for (const [name, shift] of [
    ["fromShift", fromShift],
    ["toShift", toShift]
  ]) {
    if (!shift || typeof shift !== "object") {
      return res.status(400).json({
        success: false,
        message: `${name} is required`
      });
    }

    if (!validShiftTypes.includes(shift.shiftType)) {
      return res.status(400).json({
        success: false,
        message: `${name}.shiftType must be morning, evening, or night`
      });
    }

    if (!isValidDate(shift.startAt) || !isValidDate(shift.endAt)) {
      return res.status(400).json({
        success: false,
        message: `${name} must have valid startAt and endAt dates`
      });
    }

    if (new Date(shift.endAt) <= new Date(shift.startAt)) {
      return res.status(400).json({
        success: false,
        message: `${name}.endAt must be after startAt`
      });
    }
  }

  if (
    new Date(toShift.startAt) < new Date(fromShift.endAt)
  ) {
    return res.status(400).json({
      success: false,
      message: "The incoming shift must start at or after the outgoing shift ends"
    });
  }

  if (
    req.body.incomingNurseId !== undefined &&
    req.body.incomingNurseId !== null &&
    !isObjectId(req.body.incomingNurseId)
  ) {
    return res.status(400).json({
      success: false,
      message: "incomingNurseId must be a valid user ID or null"
    });
  }

  if (
    req.body.wardId !== undefined &&
    req.body.wardId !== null &&
    !isObjectId(req.body.wardId)
  ) {
    return res.status(400).json({
      success: false,
      message: "wardId must be a valid ID or null"
    });
  }

  next();
};

const validateUpdateHandover = (req, res, next) => {
  const allowedFields = [
    "incomingNurseId",
    "patientConditionSummary",
    "significantChanges",
    "completedCare",
    "pendingItems",
    "activeCarePlanSummary",
    "orderSummary",
    "safetyConcerns",
    "changeReason"
  ];

  const fields = Object.keys(req.body);

  if (
    fields.length === 0 ||
    fields.some((field) => !allowedFields.includes(field))
  ) {
    return res.status(400).json({
      success: false,
      message: "One or more handover update fields are invalid"
    });
  }

  if (
    req.body.incomingNurseId !== undefined &&
    req.body.incomingNurseId !== null &&
    !isObjectId(req.body.incomingNurseId)
  ) {
    return res.status(400).json({
      success: false,
      message: "incomingNurseId must be a valid user ID or null"
    });
  }

  if (
    req.body.patientConditionSummary !== undefined &&
    !isString(req.body.patientConditionSummary)
  ) {
    return res.status(400).json({
      success: false,
      message: "patientConditionSummary must be a string"
    });
  }

  for (const field of ["significantChanges", "safetyConcerns"]) {
    if (
      req.body[field] !== undefined &&
      (!Array.isArray(req.body[field]) ||
        !req.body[field].every(isString))
    ) {
      return res.status(400).json({
        success: false,
        message: `${field} must be an array of strings`
      });
    }
  }

  if (req.body.completedCare !== undefined) {
    if (
      !Array.isArray(req.body.completedCare) ||
      !req.body.completedCare.every(
        (item) =>
          item &&
          isNonEmptyString(item.description) &&
          (item.status === undefined ||
            ["completed", "partially_completed"].includes(item.status)) &&
          (item.relatedNursingRecordId === undefined ||
            item.relatedNursingRecordId === null ||
            isObjectId(item.relatedNursingRecordId)) &&
          (item.completedAt === undefined ||
            isValidDate(item.completedAt))
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "completedCare contains invalid items"
      });
    }
  }

  if (req.body.pendingItems !== undefined) {
    if (
      !Array.isArray(req.body.pendingItems) ||
      !req.body.pendingItems.every(
        (item) =>
          item &&
          isNonEmptyString(item.description) &&
          (item.sourceType === undefined ||
            validSourceTypes.includes(item.sourceType)) &&
          (item.sourceId === undefined ||
            item.sourceId === null ||
            isObjectId(item.sourceId)) &&
          (item.priority === undefined ||
            validPriorities.includes(item.priority)) &&
          (item.status === undefined ||
            ["pending", "in_progress", "completed", "cancelled"].includes(
              item.status
            ))
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "pendingItems contains invalid items"
      });
    }
  }

  if (req.body.activeCarePlanSummary !== undefined) {
    if (
      !Array.isArray(req.body.activeCarePlanSummary) ||
      !req.body.activeCarePlanSummary.every(
        (item) =>
          item &&
          (item.carePlanId === undefined ||
            item.carePlanId === null ||
            isObjectId(item.carePlanId))
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "activeCarePlanSummary contains invalid items"
      });
    }
  }

  if (req.body.orderSummary !== undefined) {
    if (
      !Array.isArray(req.body.orderSummary) ||
      !req.body.orderSummary.every(
        (item) =>
          item &&
          (item.orderId === undefined ||
            item.orderId === null ||
            isObjectId(item.orderId)) &&
          (item.followUpRequired === undefined ||
            typeof item.followUpRequired === "boolean")
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "orderSummary contains invalid items"
      });
    }
  }

  if (
    req.body.changeReason !== undefined &&
    !isString(req.body.changeReason)
  ) {
    return res.status(400).json({
      success: false,
      message: "changeReason must be a string"
    });
  }

  next();
};

const validateAcknowledgeHandover = (req, res, next) => {
  const allowedFields = ["acknowledgementNotes"];

  if (
    Object.keys(req.body).some(
      (field) => !allowedFields.includes(field)
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Only acknowledgementNotes can be submitted"
    });
  }

  if (
    req.body.acknowledgementNotes !== undefined &&
    !isString(req.body.acknowledgementNotes)
  ) {
    return res.status(400).json({
      success: false,
      message: "acknowledgementNotes must be a string"
    });
  }

  next();
};

module.exports = {
  validateCreateHandover,
  validateUpdateHandover,
  validateAcknowledgeHandover
};