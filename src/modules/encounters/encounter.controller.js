
const mongoose = require("mongoose");
const Encounter = require("../../models/Encounter");
const Patient = require("../../models/Patient");
require("../../models/Ward");
require("../../models/User");
const asyncHandler = require("../../utils/asyncHandler");

const getEncounters = asyncHandler(async (req, res) => {
  const { page, limit } = req.pagination;

  const filter = {
    institutionId: req.user.institutionId
  };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.patientId) {
    const patientExists = await Patient.exists({
      _id: req.query.patientId,
      institutionId: req.user.institutionId
    });

    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    filter.patientId = req.query.patientId;
  }

  const [encounters, total] = await Promise.all([
    Encounter.find(filter)
      .populate("patientId", "patientId firstName lastName")
      .populate("wardId", "name code department")
      .populate("attendingDoctorId", "firstName lastName staffId")
      .populate("assignedNurseIds", "firstName lastName staffId role")
      .sort({ admissionDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Encounter.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: encounters,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

const getEncounterById = asyncHandler(async (req, res) => {
  const encounter = await Encounter.findOne({
    _id: req.params.id,
    institutionId: req.user.institutionId
  })
    .populate("patientId", "patientId firstName lastName dateOfBirth sex")
    .populate("wardId", "name code department floor rooms")
    .populate("attendingDoctorId", "firstName lastName staffId")
    .populate("admittingDoctorId", "firstName lastName staffId")
    .populate("assignedNurseIds", "firstName lastName staffId role")
    .lean();

  if (!encounter) {
    return res.status(404).json({
      success: false,
      message: "Encounter not found"
    });
  }

  res.status(200).json({
    success: true,
    data: encounter
  });
});

const getPatientEncounters = asyncHandler(async (req, res) => {
  const patientId = new mongoose.Types.ObjectId(req.params.patientId);

  const patientExists = await Patient.exists({
    _id: patientId,
    institutionId: req.user.institutionId
  });

  if (!patientExists) {
    return res.status(404).json({
      success: false,
      message: "Patient not found"
    });
  }

  const encounters = await Encounter.find({
    patientId,
    institutionId: req.user.institutionId
  })
    .populate("wardId", "name code department")
    .populate("attendingDoctorId", "firstName lastName staffId")
    .sort({ admissionDate: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: encounters.length,
    data: encounters
  });
});

module.exports = {
  getEncounters,
  getEncounterById,
  getPatientEncounters
};
