
const mongoose = require("mongoose");
const NursingRecord = require("../../models/NursingRecord");
const Encounter = require("../../models/Encounter");
const asyncHandler = require("../../utils/asyncHandler");

const createNursingRecord = asyncHandler(async (req, res) => {
  const { encounterId } = req.body;

  const encounter = await Encounter.findOne({
    _id: encounterId,
    institutionId: req.user.institutionId,
    status: "active"
  }).select("_id patientId institutionId");

  if (!encounter) {
    return res.status(404).json({
      success: false,
      message: "Active encounter not found"
    });
  }

  const recordData = {
    institutionId: req.user.institutionId,
    patientId: encounter.patientId,
    encounterId: encounter._id,
    createdBy: req.user._id,
    recordedAt: new Date(),
    status: "draft",
    recordType: req.body.recordType.trim()
  };

  const optionalFields = [
    "assessment",
    "vitalSigns",
    "intakeOutput",
    "interventions",
    "medicationAdministrations",
    "clinicalNotes",
    "escalations"
  ];

  for (const field of optionalFields) {
    if (req.body[field] !== undefined) {
      recordData[field] = req.body[field];
    }
  }

  if (Array.isArray(recordData.medicationAdministrations)) {
    recordData.medicationAdministrations =
      recordData.medicationAdministrations.map((item) => {
        const { documentedBy, ...safeItem } = item;
        return {
          ...safeItem,
          documentedBy: req.user._id
        };
      });
  }

  const record = await NursingRecord.create(recordData);

  res.status(201).json({
    success: true,
    message: "Nursing record saved as draft",
    data: record
  });
});

const getNursingRecords = asyncHandler(async (req, res) => {
  const { page, limit } = req.pagination;
  const { encounterId } = req.query;

  const encounter = await Encounter.findOne({
    _id: encounterId,
    institutionId: req.user.institutionId
  }).select("_id");

  if (!encounter) {
    return res.status(404).json({
      success: false,
      message: "Encounter not found"
    });
  }

  const filter = {
    institutionId: req.user.institutionId,
    encounterId: encounter._id
  };

  const [records, total] = await Promise.all([
    NursingRecord.find(filter)
      .populate("createdBy", "firstName lastName staffId role")
      .sort({ recordedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    NursingRecord.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

const getNursingRecordById = asyncHandler(async (req, res) => {
  const record = await NursingRecord.findOne({
    _id: req.params.id,
    institutionId: req.user.institutionId
  })
    .populate("createdBy", "firstName lastName staffId role")
    .lean();

  if (!record) {
    return res.status(404).json({
      success: false,
      message: "Nursing record not found"
    });
  }

  res.status(200).json({
    success: true,
    data: record
  });
});

module.exports = {
  createNursingRecord,
  getNursingRecords,
  getNursingRecordById
};
