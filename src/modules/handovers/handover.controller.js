const mongoose = require("mongoose");
const ShiftHandover = require("../../models/ShiftHandover");
const Encounter = require("../../models/Encounter");
const User = require("../../models/User");
const Ward = require("../../models/Ward");
const asyncHandler = require("../../utils/asyncHandler");

const isValidId = (id) => mongoose.isValidObjectId(id);

const findHandover = (id, institutionId) =>
  ShiftHandover.findOne({
    _id: id,
    institutionId
  });

const ensureNurse = async (userId, institutionId) => {
  const user = await User.findOne({
    _id: userId,
    institutionId,
    status: "active",
    role: { $in: ["nurse", "nurse_in_charge"] }
  }).select("_id role");

  return user;
};

const createHandover = asyncHandler(async (req, res) => {
  const encounter = await Encounter.findOne({
    _id: req.body.encounterId,
    institutionId: req.user.institutionId,
    status: "active"
  });

  if (!encounter) {
    return res.status(404).json({
      success: false,
      message: "Active encounter not found for this institution"
    });
  }

  let wardId = encounter.wardId || null;

  if (req.body.wardId) {
    const ward = await Ward.findOne({
      _id: req.body.wardId,
      institutionId: req.user.institutionId
    });

    if (!ward) {
      return res.status(404).json({
        success: false,
        message: "Ward not found for this institution"
      });
    }

    wardId = ward._id;
  }

  let incomingNurseId = null;

  if (req.body.incomingNurseId) {
    const incomingNurse = await ensureNurse(
      req.body.incomingNurseId,
      req.user.institutionId
    );

    if (!incomingNurse) {
      return res.status(400).json({
        success: false,
        message: "Incoming nurse must be an active nurse in this institution"
      });
    }

    incomingNurseId = incomingNurse._id;
  }

  const handover = await ShiftHandover.create({
    institutionId: req.user.institutionId,
    patientId: encounter.patientId,
    encounterId: encounter._id,
    wardId,
    fromShift: req.body.fromShift,
    toShift: req.body.toShift,
    outgoingNurseId: req.user._id,
    incomingNurseId,
    status: "draft",
    draftGeneratedAt: new Date()
  });

  return res.status(201).json({
    success: true,
    message: "Shift handover draft created",
    data: handover
  });
});

const getHandovers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || 10, 1),
    100
  );

  const filter = {
    institutionId: req.user.institutionId
  };

  for (const field of ["encounterId", "patientId", "wardId"]) {
    if (req.query[field]) {
      if (!isValidId(req.query[field])) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field}`
        });
      }

      filter[field] = req.query[field];
    }
  }

  if (req.query.status) {
    const statuses = ["draft", "submitted", "acknowledged", "amended"];

    if (!statuses.includes(req.query.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid handover status"
      });
    }

    filter.status = req.query.status;
  }

  const [handovers, total] = await Promise.all([
    ShiftHandover.find(filter)
      .populate("patientId", "patientNumber firstName lastName")
      .populate("encounterId", "encounterNumber status")
      .populate("wardId", "name wardCode")
      .populate("outgoingNurseId", "staffId firstName lastName role")
      .populate("incomingNurseId", "staffId firstName lastName role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ShiftHandover.countDocuments(filter)
  ]);

  return res.status(200).json({
    success: true,
    data: handovers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

const getHandoverById = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid handover ID"
    });
  }

  const handover = await findHandover(
    req.params.id,
    req.user.institutionId
  )
    .populate("patientId", "patientNumber firstName lastName")
    .populate("encounterId", "encounterNumber status")
    .populate("wardId", "name wardCode")
    .populate("outgoingNurseId", "staffId firstName lastName role")
    .populate("incomingNurseId", "staffId firstName lastName role")
    .populate("completedCare.relatedNursingRecordId", "recordType recordedAt")
    .populate("activeCarePlanSummary.carePlanId", "planNumber title status")
    .populate("orderSummary.orderId", "orderNumber title status");

  if (!handover) {
    return res.status(404).json({
      success: false,
      message: "Handover not found"
    });
  }

  return res.status(200).json({
    success: true,
    data: handover
  });
});

const updateHandoverDraft = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid handover ID"
    });
  }

  const handover = await findHandover(
    req.params.id,
    req.user.institutionId
  );

  if (!handover) {
    return res.status(404).json({
      success: false,
      message: "Handover not found"
    });
  }

  if (String(handover.outgoingNurseId) !== String(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the outgoing nurse can edit this handover"
    });
  }

  if (handover.status !== "draft") {
    return res.status(409).json({
      success: false,
      message: "Only draft handovers can be edited"
    });
  }

  if (req.body.incomingNurseId !== undefined) {
    if (req.body.incomingNurseId === null) {
      handover.incomingNurseId = null;
    } else {
      const incomingNurse = await ensureNurse(
        req.body.incomingNurseId,
        req.user.institutionId
      );

      if (!incomingNurse) {
        return res.status(400).json({
          success: false,
          message: "Incoming nurse must be active in this institution"
        });
      }

      handover.incomingNurseId = incomingNurse._id;
    }
  }

  const allowedFields = [
    "patientConditionSummary",
    "significantChanges",
    "completedCare",
    "pendingItems",
    "activeCarePlanSummary",
    "orderSummary",
    "safetyConcerns"
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      handover[field] = req.body[field];
    }
  }

  await handover.save();

  return res.status(200).json({
    success: true,
    message: "Handover draft updated",
    data: handover
  });
});

const submitHandover = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid handover ID"
    });
  }

  const handover = await findHandover(
    req.params.id,
    req.user.institutionId
  );

  if (!handover) {
    return res.status(404).json({
      success: false,
      message: "Handover not found"
    });
  }

  if (String(handover.outgoingNurseId) !== String(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the outgoing nurse can submit this handover"
    });
  }

  if (handover.status !== "draft") {
    return res.status(409).json({
      success: false,
      message: "Only draft handovers can be submitted"
    });
  }

  if (!handover.incomingNurseId) {
    return res.status(400).json({
      success: false,
      message: "Assign an incoming nurse before submitting"
    });
  }

  handover.status = "submitted";
  handover.submittedAt = new Date();

  await handover.save();

  return res.status(200).json({
    success: true,
    message: "Handover submitted",
    data: handover
  });
});

const acknowledgeHandover = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid handover ID"
    });
  }

  const handover = await findHandover(
    req.params.id,
    req.user.institutionId
  );

  if (!handover) {
    return res.status(404).json({
      success: false,
      message: "Handover not found"
    });
  }

  if (
    !handover.incomingNurseId ||
    String(handover.incomingNurseId) !== String(req.user._id)
  ) {
    return res.status(403).json({
      success: false,
      message: "Only the designated incoming nurse can acknowledge this handover"
    });
  }

  if (handover.status !== "submitted") {
    return res.status(409).json({
      success: false,
      message: "Only submitted handovers can be acknowledged"
    });
  }

  handover.status = "acknowledged";
  handover.acknowledgedAt = new Date();
  handover.acknowledgementNotes =
    req.body.acknowledgementNotes?.trim() || "";

  await handover.save();

  return res.status(200).json({
    success: true,
    message: "Handover acknowledged",
    data: handover
  });
});

module.exports = {
  createHandover,
  getHandovers,
  getHandoverById,
  updateHandoverDraft,
  submitHandover,
  acknowledgeHandover
};