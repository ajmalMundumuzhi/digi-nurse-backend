
const mongoose = require("mongoose");

const allowedStatuses = [
  "active",
  "discharged",
  "transferred",
  "cancelled"
];

const validateEncounterQuery = (req, res, next) => {
  const { page = "1", limit = "10", status, patientId } = req.query;

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

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid encounter status"
    });
  }

  if (patientId && !mongoose.isValidObjectId(patientId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID"
    });
  }

  req.pagination = {
    page: parsedPage,
    limit: parsedLimit
  };

  next();
};

const validateEncounterId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid encounter ID"
    });
  }

  next();
};

const validatePatientId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.patientId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID"
    });
  }

  next();
};

module.exports = {
  validateEncounterQuery,
  validateEncounterId,
  validatePatientId
};
