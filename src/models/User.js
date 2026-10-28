
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true
    },
    staffId: {
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
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: { type: String, trim: true },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ["nurse", "doctor", "nurse_in_charge", "admin"],
      required: true
    },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    wardIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward"
    }],
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active"
    },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.index(
  { institutionId: 1, staffId: 1 },
  { unique: true }
);

userSchema.index(
  { institutionId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string" } }
  }
);

module.exports = mongoose.model("User", userSchema);
