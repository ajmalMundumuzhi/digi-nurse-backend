
const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema(
  {
    bedNumber: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available"
    }
  },
  { _id: true }
);

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      trim: true
    },
    beds: {
      type: [bedSchema],
      default: []
    }
  },
  { _id: true }
);

const wardSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true
    },
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
    department: { type: String, trim: true },
    floor: { type: String, trim: true },
    rooms: {
      type: [roomSchema],
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

wardSchema.index(
  { institutionId: 1, code: 1 },
  { unique: true }
);

module.exports = mongoose.model("Ward", wardSchema);
