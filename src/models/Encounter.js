
const mongoose = require("mongoose");

const encounterSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    encounterNumber: {
      type: String,
      required: true,
      trim: true
    },
    encounterType: {
      type: String,
      enum: ["inpatient", "outpatient", "emergency"],
      default: "inpatient"
    },
    admissionDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    admissionReason: { type: String, trim: true },
    admittingDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    attendingDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward"
    },
    roomNumber: { type: String, trim: true },
    bedNumber: { type: String, trim: true },
    assignedNurseIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    status: {
      type: String,
      enum: ["active", "discharged", "transferred", "cancelled"],
      default: "active"
    },
    dischargeDate: { type: Date },
    dischargeSummary: { type: String, trim: true }
  },
  { timestamps: true }
);

encounterSchema.index(
  { institutionId: 1, encounterNumber: 1 },
  { unique: true }
);

encounterSchema.index({
  institutionId: 1,
  patientId: 1,
  admissionDate: -1
});

module.exports = mongoose.model("Encounter", encounterSchema);
