
const mongoose = require("mongoose");

const nursingRecordSchema = new mongoose.Schema(
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
    recordType: {
      type: String,
      enum: [
        "initial_assessment",
        "routine_observation",
        "nursing_progress_note",
        "intervention_note",
        "medication_administration",
        "shift_assessment"
      ],
      required: true
    },
    recordedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    status: {
      type: String,
      enum: ["draft", "finalized", "amended"],
      default: "draft"
    },
    assessment: {
      chiefComplaint: { type: String, trim: true },
      levelOfConsciousness: { type: String, trim: true },
      orientation: [{ type: String }],
      painScore: { type: Number, min: 0, max: 10 },
      painLocation: { type: String, trim: true },
      mobilityStatus: { type: String, trim: true },
      skinAssessment: { type: String, trim: true },
      fallRiskAssessment: {
        score: { type: Number },
        category: { type: String, trim: true },
        notes: { type: String, trim: true }
      },
      nutritionAssessment: { type: String, trim: true },
      eliminationAssessment: { type: String, trim: true },
      respiratoryAssessment: { type: String, trim: true },
      additionalFindings: { type: String, trim: true }
    },
    vitalSigns: {
      temperature: {
        value: { type: Number, min: 0 },
        unit: { type: String, enum: ["C", "F"] }
      },
      pulse: {
        value: { type: Number, min: 0 },
        unit: { type: String, default: "beats/min" }
      },
      bloodPressure: {
        systolic: { type: Number, min: 0 },
        diastolic: { type: Number, min: 0 },
        unit: { type: String, default: "mmHg" }
      },
      respiratoryRate: {
        value: { type: Number, min: 0 },
        unit: { type: String, default: "breaths/min" }
      },
      oxygenSaturation: {
        value: { type: Number, min: 0, max: 100 },
        unit: { type: String, default: "%" }
      },
      oxygenSupport: {
        method: { type: String, trim: true },
        flowRate: { type: Number, min: 0 },
        flowRateUnit: { type: String, default: "L/min" }
      },
      bloodGlucose: {
        value: { type: Number, min: 0 },
        unit: { type: String, trim: true }
      },
      painScore: { type: Number, min: 0, max: 10 },
      measuredAt: { type: Date },
      measuredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    },
    intakeOutput: {
      intake: [{
        type: { type: String, trim: true },
        volume: { type: Number, min: 0 },
        unit: { type: String, default: "mL" },
        recordedAt: { type: Date, default: Date.now }
      }],
      output: [{
        type: { type: String, trim: true },
        volume: { type: Number, min: 0 },
        unit: { type: String, default: "mL" },
        recordedAt: { type: Date, default: Date.now }
      }],
      periodStart: { type: Date },
      periodEnd: { type: Date },
      notes: { type: String, trim: true }
    },
    interventions: [{
      interventionType: { type: String, trim: true },
      description: { type: String, required: true, trim: true },
      carePlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NursingCarePlan",
        default: null
      },
      relatedOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DoctorOrder",
        default: null
      },
      performedAt: { type: Date },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      status: {
        type: String,
        enum: ["completed", "partially_completed", "not_completed"],
        default: "completed"
      },
      patientResponse: { type: String, trim: true },
      exceptionReason: { type: String, trim: true }
    }],
    medicationAdministrations: [{
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DoctorOrder",
        required: true
      },
      medicationNameSnapshot: { type: String, required: true, trim: true },
      prescribedDoseSnapshot: { type: Number, required: true, min: 0 },
      doseUnitSnapshot: { type: String, required: true, trim: true },
      routeSnapshot: { type: String, required: true, trim: true },
      scheduledAt: { type: Date },
      administeredAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ["given", "withheld", "refused", "omitted", "not_due"],
        required: true
      },
      reason: { type: String, trim: true },
      patientResponse: { type: String, trim: true },
      documentedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    }],
    clinicalNotes: { type: String, trim: true },
    escalations: [{
      reason: { type: String, required: true, trim: true },
      reportedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      reportedAt: { type: Date, default: Date.now },
      communicationMethod: { type: String, trim: true },
      response: { type: String, trim: true },
      followUpRequired: { type: Boolean, default: false }
    }],
    finalizedAt: { type: Date },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

nursingRecordSchema.index({
  institutionId: 1,
  encounterId: 1,
  recordedAt: -1
});

module.exports = mongoose.model("NursingRecord", nursingRecordSchema);