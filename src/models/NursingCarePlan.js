
const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    goalId: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    baselineValue: { type: Number, default: null },
    baselineUnit: { type: String, trim: true },
    targetValue: { type: Number, default: null },
    targetUnit: { type: String, trim: true },
    successCriteria: { type: String, trim: true },
    targetDate: { type: Date },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "achieved", "not_achieved"],
      default: "not_started"
    },
    evaluatedAt: { type: Date },
    evaluationNotes: { type: String, trim: true }
  },
  { _id: false }
);

const interventionSchema = new mongoose.Schema(
  {
    interventionId: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    interventionType: { type: String, trim: true },
    linkedGoalId: { type: String, default: null },
    frequency: { type: String, trim: true },
    scheduledTimes: [{ type: Date }],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    status: {
      type: String,
      enum: [
        "planned",
        "in_progress",
        "completed",
        "partially_completed",
        "not_completed"
      ],
      default: "planned"
    },
    completedAt: { type: Date },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    relatedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorOrder",
      default: null
    },
    relatedNursingRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NursingRecord",
      default: null
    },
    patientResponse: { type: String, trim: true },
    exceptionReason: { type: String, trim: true }
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    problemId: { type: String, required: true },
    diagnosisCode: { type: String, trim: true },
    diagnosisName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    supportingEvidence: [{ type: String, trim: true }],
    riskFactors: [{ type: String, trim: true }],
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    identifiedAt: { type: Date, default: Date.now },
    identifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["active", "resolved", "discontinued"],
      default: "active"
    },
    goals: { type: [goalSchema], default: [] },
    interventions: { type: [interventionSchema], default: [] },
    evaluation: {
      outcome: {
        type: String,
        enum: [
          "improving",
          "unchanged",
          "worsening",
          "resolved",
          "not_evaluated"
        ],
        default: "not_evaluated"
      },
      findings: { type: String, trim: true },
      goalProgress: { type: String, trim: true },
      recommendedReview: { type: Boolean, default: false },
      evaluatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      evaluatedAt: { type: Date }
    }
  },
  { _id: false }
);

const revisionSchema = new mongoose.Schema(
  {
    planVersion: { type: Number, required: true },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    changedAt: { type: Date, default: Date.now },
    changeReason: { type: String, trim: true },
    previousVersionReference: { type: String, trim: true }
  },
  { _id: false }
);

const nursingCarePlanSchema = new mongoose.Schema(
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
    planNumber: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "active", "on_hold", "completed", "discontinued"],
      default: "draft"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    problems: { type: [problemSchema], default: [] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: { type: Date },
    activatedAt: { type: Date },
    lastEvaluatedAt: { type: Date },
    version: { type: Number, default: 1, min: 1 },
    revisionHistory: { type: [revisionSchema], default: [] }
  },
  { timestamps: true }
);

nursingCarePlanSchema.index(
  { institutionId: 1, planNumber: 1 },
  { unique: true }
);

nursingCarePlanSchema.index({
  institutionId: 1,
  encounterId: 1,
  status: 1
});

module.exports = mongoose.model("NursingCarePlan", nursingCarePlanSchema);