
const mongoose = require("mongoose");

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" }
    },
    phone: { type: String, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    settings: {
      timeFormat: {
        type: String,
        enum: ["12h", "24h"],
        default: "24h"
      },
      dateFormat: {
        type: String,
        default: "DD/MM/YYYY"
      },
      enabledModules: {
        type: [String],
        default: [
          "nursing_records",
          "doctor_orders",
          "care_plans",
          "handovers"
        ]
      },
      documentationPolicyVersion: {
        type: String,
        default: "1.0"
      }
    }
  },
  { timestamps: true }
);

institutionSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model("Institution", institutionSchema);
