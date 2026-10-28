
const mongoose = require("mongoose");

const allergySchema = new mongoose.Schema(
  {
    substance: {
      type: String,
      required: true,
      trim: true
    },
    reaction: { type: String, trim: true },
    severity: {
      type: String,
      enum: ["mild", "moderate", "severe", "unknown"],
      default: "unknown"
    },
    status: {
      type: String,
      enum: ["active", "resolved", "unverified"],
      default: "unverified"
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    recordedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const historySchema = new mongoose.Schema(
  {
    condition: {
      type: String,
      required: true,
      trim: true
    },
    details: { type: String, trim: true },
    recordedAt: { type: Date, default: Date.now },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { _id: true }
);

const patientSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      trim: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      trim: true,
      default: ""
    },
    dateOfBirth: { type: Date },
    sex: {
      type: String,
      enum: ["female", "male", "intersex", "unknown", "not_recorded"],
      default: "not_recorded"
    },
    phone: { type: String, trim: true },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" }
    },
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { type: String, trim: true }
    },
    allergies: {
      type: [allergySchema],
      default: []
    },
    medicalHistory: {
      type: [historySchema],
      default: []
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);

patientSchema.index(
  { institutionId: 1, patientId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Patient", patientSchema);
