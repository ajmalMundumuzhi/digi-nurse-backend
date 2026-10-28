
const crypto = require("crypto");
const DoctorOrder = require("../../models/DoctorOrder");
const Encounter = require("../../models/Encounter");
const asyncHandler = require("../../utils/asyncHandler");

require("../../models/User");
require("../../models/Patient");

const createDoctorOrder = asyncHandler(async (req, res) => {
  const encounter = await Encounter.findOne({
    _id: req.body.encounterId,
    institutionId: req.user.institutionId,
    status: "active"
  }).select("_id patientId institutionId");

  if (!encounter) {
    return res.status(404).json({
      success: false,
      message: "Active encounter not found"
    });
  }

  const orderNumber =
    `ORD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const fields = [
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

  const orderData = {
    institutionId: req.user.institutionId,
    patientId: encounter.patientId,
    encounterId: encounter._id,
    orderNumber,
    orderType: req.body.orderType,
    title: req.body.title.trim(),
    orderedBy: req.user._id,
    orderedAt: new Date(),
    status: "pending_authentication"
  };

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      orderData[field] = req.body[field];
    }
  }

  const order = await DoctorOrder.create(orderData);

  res.status(201).json({
    success: true,
    message: "Order created and awaiting authentication",
    data: order
  });
});

const getDoctorOrders = asyncHandler(async (req, res) => {
  const { page, limit } = req.pagination;

  const encounter = await Encounter.findOne({
    _id: req.query.encounterId,
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

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [orders, total] = await Promise.all([
    DoctorOrder.find(filter)
      .populate("orderedBy", "firstName lastName staffId role")
      .populate("authenticatedBy", "firstName lastName staffId role")
      .sort({ orderedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    DoctorOrder.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

const getDoctorOrderById = asyncHandler(async (req, res) => {
  const order = await DoctorOrder.findOne({
    _id: req.params.id,
    institutionId: req.user.institutionId
  })
    .populate("patientId", "patientId firstName lastName")
    .populate("encounterId", "encounterNumber status admissionDate")
    .populate("orderedBy", "firstName lastName staffId role")
    .populate("authenticatedBy", "firstName lastName staffId role")
    .populate("nurseAcknowledgements.nurseId", "firstName lastName staffId")
    .lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Doctor's order not found"
    });
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

const authenticateDoctorOrder = asyncHandler(async (req, res) => {
  const order = await DoctorOrder.findOne({
    _id: req.params.id,
    institutionId: req.user.institutionId
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Doctor's order not found"
    });
  }

  if (order.status !== "pending_authentication") {
    return res.status(409).json({
      success: false,
      message: "Only pending orders can be authenticated"
    });
  }

  if (String(order.orderedBy) !== String(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the ordering doctor can authenticate this order"
    });
  }

  order.status = "active";
  order.authenticatedAt = new Date();
  order.authenticatedBy = req.user._id;

  await order.save();

  res.status(200).json({
    success: true,
    message: "Order authenticated and activated",
    data: order
  });
});

const acknowledgeDoctorOrder = asyncHandler(async (req, res) => {
  const order = await DoctorOrder.findOne({
    _id: req.params.id,
    institutionId: req.user.institutionId
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Doctor's order not found"
    });
  }

  if (order.status !== "active") {
    return res.status(409).json({
      success: false,
      message: "Only active orders can be acknowledged"
    });
  }

  const acknowledgement = {
    nurseId: req.user._id,
    acknowledgedAt: new Date(),
    status: req.body.status
  };

  if (req.body.clarificationNote !== undefined) {
    acknowledgement.clarificationNote =
      req.body.clarificationNote.trim();
  }

  order.nurseAcknowledgements.push(acknowledgement);

  await order.save();

  res.status(201).json({
    success: true,
    message: "Order acknowledgement recorded",
    data: order.nurseAcknowledgements[
      order.nurseAcknowledgements.length - 1
    ]
  });
});

module.exports = {
  createDoctorOrder,
  getDoctorOrders,
  getDoctorOrderById,
  authenticateDoctorOrder,
  acknowledgeDoctorOrder
};