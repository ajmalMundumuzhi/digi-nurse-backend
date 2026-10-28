
const mongoose = require("mongoose");

const validateCreateRecord = (req, res, next) => {
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

  if (
    typeof body.recordType !== "string" ||
    !body.recordType.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Record type is required"
    });
  }

  const allowedFields = [
    "encounterId",
    "recordType",
    "assessment",
    "vitalSigns",
    "intakeOutput",
    "interventions",
    "medicationAdministrations",
    "clinicalNotes",
    "escalations"
  ];

  const unexpectedFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (unexpectedFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Request contains unsupported fields",
      fields: unexpectedFields
    });
  }

  if (
    body.clinicalNotes !== undefined &&
    typeof body.clinicalNotes !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Clinical notes must be a string"
    });
  }

  if (
    body.clinicalNotes &&
    body.clinicalNotes.length > 10000
  ) {
    return res.status(400).json({
      success: false,
      message: "Clinical notes are too long"
    });
  }

  for (const field of [
    "assessment",
    "vitalSigns",
    "intakeOutput"
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
    "interventions",
    "medicationAdministrations",
    "escalations"
  ]) {
    if (
      body[field] !== undefined &&
      !Array.isArray(body[field])
    ) {
      return res.status(400).json({
        success: false,
        message: `${field} must be an array`
      });
    }
  }

  next();
};

const validateRecordQuery = (req, res, next) => {
  const { encounterId, page = "1", limit = "10" } = req.query;

  if (
    typeof encounterId !== "string" ||
    !mongoose.isValidObjectId(encounterId)
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid encounterId query parameter is required"
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

const validateRecordId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid nursing record ID"
    });
  }

  next();
};

module.exports = {
  validateCreateRecord,
  validateRecordQuery,
  validateRecordId
};