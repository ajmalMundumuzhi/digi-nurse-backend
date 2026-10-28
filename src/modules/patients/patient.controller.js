
const mongoose = require("mongoose");
const Patient = require("../../models/Patient");
const asyncHandler = require("../../utils/asyncHandler");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPatients = asyncHandler(async (req, res) => {
  const { page, limit } = req.pagination;
  const search = (req.query.search || "").trim();

  const filter = {
    institutionId: req.user.institutionId
  };

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { patientId: searchRegex },
      { firstName: searchRegex },
      { lastName: searchRegex }
    ];
  }

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .select(
        "patientId firstName lastName dateOfBirth sex status"
      )
      .sort({ lastName: 1, firstName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Patient.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: patients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({
    _id: new mongoose.Types.ObjectId(req.params.id),
    institutionId: req.user.institutionId
  })
    .select("-__v")
    .lean();

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient not found"
    });
  }

  res.status(200).json({
    success: true,
    data: patient
  });
});

module.exports = {
  getPatients,
  getPatientById
};
