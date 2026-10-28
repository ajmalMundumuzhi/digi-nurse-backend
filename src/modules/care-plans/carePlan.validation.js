const mongoose = require("mongoose");

const isObjectId = (value) => mongoose.isValidObjectId(value);

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const validateCreateCarePlan = (req, res, next) => {
  const { encounterId, title, priority } = req.body;

  if (!isObjectId(encounterId)) {
    return res.status(400).json({
      success: false,
      message: "A valid encounterId is required"
    });
  }

  if (!isNonEmptyString(title)) {
    return res.status(400).json({
      success: false,
      message: "A title is required"
    });
  }

  if (
    priority !== undefined &&
    !["low", "medium", "high"].includes(priority)
  ) {
    return res.status(400).json({
      success: false,
      message: "Priority must be low, medium, or high"
    });
  }

  next();
};

const validateUpdateCarePlan = (req, res, next) => {
  const allowedFields = ["title", "priority", "changeReason"];
  const suppliedFields = Object.keys(req.body);

  if (
    suppliedFields.length === 0 ||
    suppliedFields.some((field) => !allowedFields.includes(field))
  ) {
    return res.status(400).json({
      success: false,
      message: "Only title, priority, and changeReason can be updated here"
    });
  }

  if (
    req.body.title !== undefined &&
    !isNonEmptyString(req.body.title)
  ) {
    return res.status(400).json({
      success: false,
      message: "Title must be a non-empty string"
    });
  }

  if (
    req.body.priority !== undefined &&
    !["low", "medium", "high"].includes(req.body.priority)
  ) {
    return res.status(400).json({
      success: false,
      message: "Priority must be low, medium, or high"
    });
  }

  if (
    req.body.changeReason !== undefined &&
    typeof req.body.changeReason !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "changeReason must be a string"
    });
  }

  next();
};

const validateStatusChange = (req, res, next) => {
  const allowedStatuses = [
    "active",
    "on_hold",
    "completed",
    "discontinued"
  ];

  if (!allowedStatuses.includes(req.body.status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${allowedStatuses.join(", ")}`
    });
  }

  if (
    req.body.changeReason !== undefined &&
    typeof req.body.changeReason !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "changeReason must be a string"
    });
  }

  next();
};

const validateProblem = (req, res, next) => {
  const { diagnosisName, priority } = req.body;

  if (!isNonEmptyString(diagnosisName)) {
    return res.status(400).json({
      success: false,
      message: "diagnosisName is required"
    });
  }

  if (
    priority !== undefined &&
    !["low", "medium", "high"].includes(priority)
  ) {
    return res.status(400).json({
      success: false,
      message: "Priority must be low, medium, or high"
    });
  }

  if (
    req.body.supportingEvidence !== undefined &&
    (!Array.isArray(req.body.supportingEvidence) ||
      !req.body.supportingEvidence.every(
        (item) => typeof item === "string"
      ))
  ) {
    return res.status(400).json({
      success: false,
      message: "supportingEvidence must be an array of strings"
    });
  }

  if (
    req.body.riskFactors !== undefined &&
    (!Array.isArray(req.body.riskFactors) ||
      !req.body.riskFactors.every((item) => typeof item === "string"))
  ) {
    return res.status(400).json({
      success: false,
      message: "riskFactors must be an array of strings"
    });
  }

  next();
};

const validateGoal = (req, res, next) => {
  if (!isNonEmptyString(req.body.description)) {
    return res.status(400).json({
      success: false,
      message: "Goal description is required"
    });
  }

  for (const field of ["baselineValue", "targetValue"]) {
    if (
      req.body[field] !== undefined &&
      req.body[field] !== null &&
      (typeof req.body[field] !== "number" ||
        !Number.isFinite(req.body[field]))
    ) {
      return res.status(400).json({
        success: false,
        message: `${field} must be a number or null`
      });
    }
  }

  if (
    req.body.targetDate !== undefined &&
    Number.isNaN(Date.parse(req.body.targetDate))
  ) {
    return res.status(400).json({
      success: false,
      message: "targetDate must be a valid date"
    });
  }

  next();
};

const validateIntervention = (req, res, next) => {
  if (!isNonEmptyString(req.body.description)) {
    return res.status(400).json({
      success: false,
      message: "Intervention description is required"
    });
  }

  if (
    req.body.relatedOrderId !== undefined &&
    req.body.relatedOrderId !== null &&
    !isObjectId(req.body.relatedOrderId)
  ) {
    return res.status(400).json({
      success: false,
      message: "relatedOrderId must be a valid ID or null"
    });
  }

  if (
    req.body.relatedNursingRecordId !== undefined &&
    req.body.relatedNursingRecordId !== null &&
    !isObjectId(req.body.relatedNursingRecordId)
  ) {
    return res.status(400).json({
      success: false,
      message: "relatedNursingRecordId must be a valid ID or null"
    });
  }

  if (
    req.body.scheduledTimes !== undefined &&
    (!Array.isArray(req.body.scheduledTimes) ||
      !req.body.scheduledTimes.every(
        (date) => !Number.isNaN(Date.parse(date))
      ))
  ) {
    return res.status(400).json({
      success: false,
      message: "scheduledTimes must be an array of valid dates"
    });
  }

  next();
};

const validateGoalUpdate = (req, res, next) => {
  const allowedFields = [
    "status",
    "evaluationNotes",
    "baselineValue",
    "baselineUnit",
    "targetValue",
    "targetUnit",
    "successCriteria",
    "targetDate"
  ];

  const suppliedFields = Object.keys(req.body);

  if (
    suppliedFields.length === 0 ||
    suppliedFields.some((field) => !allowedFields.includes(field))
  ) {
    return res.status(400).json({
      success: false,
      message: "One or more goal update fields are invalid"
    });
  }

  if (
    req.body.status !== undefined &&
    !["not_started", "in_progress", "achieved", "not_achieved"].includes(
      req.body.status
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid goal status"
    });
  }

  for (const field of ["baselineValue", "targetValue"]) {
    if (
      req.body[field] !== undefined &&
      req.body[field] !== null &&
      (typeof req.body[field] !== "number" ||
        !Number.isFinite(req.body[field]))
    ) {
      return res.status(400).json({
        success: false,
        message: `${field} must be a number or null`
      });
    }
  }

  next();
};

const validateInterventionUpdate = (req, res, next) => {
  const allowedFields = [
    "status",
    "patientResponse",
    "exceptionReason",
    "frequency",
    "scheduledTimes"
  ];

  const suppliedFields = Object.keys(req.body);

  if (
    suppliedFields.length === 0 ||
    suppliedFields.some((field) => !allowedFields.includes(field))
  ) {
    return res.status(400).json({
      success: false,
      message: "One or more intervention update fields are invalid"
    });
  }

  if (
    req.body.status !== undefined &&
    ![
      "planned",
      "in_progress",
      "completed",
      "partially_completed",
      "not_completed"
    ].includes(req.body.status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid intervention status"
    });
  }

  if (
    req.body.scheduledTimes !== undefined &&
    (!Array.isArray(req.body.scheduledTimes) ||
      !req.body.scheduledTimes.every(
        (date) => !Number.isNaN(Date.parse(date))
      ))
  ) {
    return res.status(400).json({
      success: false,
      message: "scheduledTimes must be an array of valid dates"
    });
  }

  next();
};

const validateEvaluation = (req, res, next) => {
  const allowedOutcomes = [
    "improving",
    "unchanged",
    "worsening",
    "resolved",
    "not_evaluated"
  ];

  if (
    req.body.outcome !== undefined &&
    !allowedOutcomes.includes(req.body.outcome)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid evaluation outcome"
    });
  }

  if (
    req.body.recommendedReview !== undefined &&
    typeof req.body.recommendedReview !== "boolean"
  ) {
    return res.status(400).json({
      success: false,
      message: "recommendedReview must be a boolean"
    });
  }

  if (
    req.body.findings !== undefined &&
    typeof req.body.findings !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "findings must be a string"
    });
  }

  if (
    req.body.goalProgress !== undefined &&
    typeof req.body.goalProgress !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "goalProgress must be a string"
    });
  }

  next();
};

module.exports = {
  validateCreateCarePlan,
  validateUpdateCarePlan,
  validateStatusChange,
  validateProblem,
  validateGoal,
  validateIntervention,
  validateGoalUpdate,
  validateInterventionUpdate,
  validateEvaluation
};