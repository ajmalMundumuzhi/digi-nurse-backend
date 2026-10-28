const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./modules/auth/auth.routes");
const errorHandler = require("./middleware/error.middleware");
const patientRoutes = require("./modules/patients/patient.routes");
const encounterRoutes = require("./modules/encounters/encounter.routes");
const nursingRecordRoutes = require("./modules/nursing-records/nursingRecord.routes");
const doctorOrderRoutes = require("./modules/doctor-orders/doctorOrder.routes");
const carePlanRoutes = require("./modules/care-plans/carePlan.routes");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NurseFlow API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);    
app.use("/api/encounters", encounterRoutes);
app.use("/api/nursing-records", nursingRecordRoutes);
app.use("/api/doctor-orders", doctorOrderRoutes);
app.use("/api/care-plans", carePlanRoutes);

app.use(errorHandler);

module.exports = app;