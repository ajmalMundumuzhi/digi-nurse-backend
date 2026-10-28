
const mongoose = require("mongoose");

const shiftHandoverSchema = new mongoose.Schema(
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
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward"
    },
    fromShift: {
      shiftType: {
        type: String,
        enum: ["morning", "evening", "night"],
        required: true
      },
      startAt: { type: Date, required: true },
      endAt: { type: Date, required: true }
    },
    toShift: {
      shiftType: {
        type: String,
        enum: ["morning", "evening", "night"],
        required: true
      },
      startAt: { type: Date, required: true },
      endAt: { type: Date, required: true }
    },
    outgoingNurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    incomingNurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    patientConditionSummary: {
      type: String,
      trim: true,
      default: ""
    },
    significantChanges: [{
      type: String,
      trim: true
    }],
    completedCare: [{
      description: { type: String, required: true, trim: true },
      relatedNursingRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NursingRecord"
      },
      completedAt: { type: Date },
      status: {
        type: String,
        enum: ["completed", "partially_completed"],
        default: "completed"
      }
    }],
    pendingItems: [{
      description: { type: String, required: true, trim: true },
      sourceType: {
        type: String,
        enum: [
          "doctor_order",
          "care_plan",
          "nursing_record",
          "other"
        ],
        default: "other"
      },
      sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
      reasonPending: { type: String, trim: true },
      priority: {
        type: String,
        enum: ["routine", "urgent", "emergency"],
        default: "routine"
      },
      followUpInstructions: { type: String, trim: true },
      status: {
        type: String,
        enum: ["pending", "in_progress", "completed", "cancelled"],
        default: "pending"
      }
    }],
    activeCarePlanSummary: [{
      carePlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NursingCarePlan"
      },
      problemDescription: { type: String, trim: true },
      goalDescription: { type: String, trim: true },
      currentStatus: { type: String, trim: true }
    }],
    orderSummary: [{
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DoctorOrder"
      },
      orderType: { type: String, trim: true },
      orderStatus: { type: String, trim: true },
      followUpRequired: { type: Boolean, default: false }
    }],
    safetyConcerns: [{
      type: String,
      trim: true
    }],
    draftGeneratedAt: { type: Date },
    status: {
      type: String,
      enum: ["draft", "submitted", "acknowledged", "amended"],
      default: "draft"
    },
    submittedAt: { type: Date },
    acknowledgedAt: { type: Date },
    acknowledgementNotes: { type: String, trim: true }
  },
  { timestamps: true }
);

shiftHandoverSchema.index({
  institutionId: 1,
  encounterId: 1,
  submittedAt: -1
});

module.exports = mongoose.model("ShiftHandover", shiftHandoverSchema);
