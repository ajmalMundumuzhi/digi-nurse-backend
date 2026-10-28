
const mongoose = require("mongoose");

const validatePatientQuery = (req, res, next) => {
  const { search, page = "1", limit = "10" } = req.query;

  if (search !== undefined && typeof search !== "string") {
    return res.status(400).json({
      success: false,
      message: "Search must be a string"
    });
  }

  if (search && search.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Search query is too long"
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

const validatePatientId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid patient ID"
    });
  }

  next();
};

module.exports = {
  validatePatientQuery,
  validatePatientId
};
