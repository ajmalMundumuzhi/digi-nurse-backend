
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    resourceType: {
      type: String,
      enum: [
        "patient",
        "encounter",
        "nursing_record",
        "doctor_order",
        "care_plan",
        "handover",
        "user",
        "institution",
        "ward"
      ],
      required: true
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null
    },
    encounterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Encounter",
      default: null
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    outcome: {
      type: String,
      enum: ["success", "failure"],
      default: "success"
    },
    reason: { type: String, trim: true },
    requestId: { type: String, trim: true },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { versionKey: false }
);

auditLogSchema.index({
  institutionId: 1,
  resourceType: 1,
  resourceId: 1,
  timestamp: -1
});

auditLogSchema.index({
  institutionId: 1,
  actorId: 1,
  timestamp: -1
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
