
const mongoose = require("mongoose");

const doctorOrderSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    encounterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Encounter",
      required: true
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true
    },
    orderType: {
      type: String,
      enum: [
        "medication",
        "lab",
        "imaging",
        "procedure",
        "nursing_instruction",
        "other"
      ],
      required: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    clinicalIndication: { type: String, trim: true },
    priority: {
      type: String,
      enum: ["routine", "urgent", "emergency"],
      default: "routine"
    },
    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    orderedAt: { type: Date, default: Date.now },
    
    authenticatedAt: {
        type: Date,
        default: null
    },
    authenticatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    status: {
      type: String,
      enum: [
        "draft",
        "pending_authentication",
        "active",
        "completed",
        "cancelled",
        "discontinued"
      ],
      default: "draft"
    },
    effectiveFrom: { type: Date },
    effectiveUntil: { type: Date, default: null },
    medicationDetails: {
      medicationCode: { type: String, trim: true },
      medicationName: { type: String, trim: true },
      formulation: { type: String, trim: true },
      dose: { type: Number, min: 0 },
      doseUnit: { type: String, trim: true },
      route: { type: String, trim: true },
      frequency: { type: String, trim: true },
      schedule: [{ type: Date }],
      startAt: { type: Date },
      endAt: { type: Date },
      duration: { type: String, trim: true },
      prn: {
        isPRN: { type: Boolean, default: false },
        indication: { type: String, trim: true },
        maximumFrequency: { type: String, trim: true },
        maximumDose: { type: Number, min: 0 },
        maximumDoseUnit: { type: String, trim: true }
      },
      instructions: { type: String, trim: true },
      monitoringRequirements: [{ type: String, trim: true }]
    },
    investigationDetails: {
      investigationName: { type: String, trim: true },
      investigationCode: { type: String, trim: true },
      specimenType: { type: String, trim: true },
      preparationInstructions: { type: String, trim: true },
      requestedAt: { type: Date },
      collectionStatus: {
        type: String,
        enum: ["not_collected", "collected", "cancelled"],
        default: "not_collected"
      },
      collectedAt: { type: Date },
      collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      resultStatus: {
        type: String,
        enum: ["pending", "available", "reviewed", "not_applicable"],
        default: "pending"
      },
      resultReference: { type: String, trim: true },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      reviewedAt: { type: Date }
    },
    procedureDetails: {
      procedureName: { type: String, trim: true },
      indication: { type: String, trim: true },
      scheduledAt: { type: Date },
      preparationInstructions: { type: String, trim: true },
      monitoringRequirements: [{ type: String, trim: true }],
      responsibleDepartment: { type: String, trim: true }
    },
    instructionDetails: {
      instructionCategory: {
        type: String,
        enum: [
          "diet",
          "mobility",
          "oxygen",
          "fluid",
          "wound_care",
          "monitoring",
          "other"
        ]
      },
      instruction: { type: String, trim: true },
      frequency: { type: String, trim: true },
      precautions: { type: String, trim: true },
      reviewAt: { type: Date }
    },
    nurseAcknowledgements: [{
      nurseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      acknowledgedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["acknowledged", "clarification_requested"],
        required: true
      },
      clarificationNote: { type: String, trim: true }
    }],
    executionRecords: [{
      action: { type: String, trim: true },
      status: {
        type: String,
        enum: ["completed", "partially_completed", "not_completed"],
        required: true
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      performedAt: { type: Date, default: Date.now },
      notes: { type: String, trim: true },
      exceptionReason: { type: String, trim: true },
      relatedNursingRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NursingRecord"
      }
    }],
    discontinuation: {
      discontinuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      discontinuedAt: { type: Date },
      reason: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

doctorOrderSchema.index(
  { institutionId: 1, orderNumber: 1 },
  { unique: true }
);

doctorOrderSchema.index({
  institutionId: 1,
  encounterId: 1,
  status: 1
});

module.exports = mongoose.model("DoctorOrder", doctorOrderSchema);
