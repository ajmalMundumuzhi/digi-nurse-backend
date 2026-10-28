
const models = [
  "./src/models/Institution",
  "./src/models/User",
  "./src/models/Ward",
  "./src/models/Patient",
  "./src/models/Encounter",
  "./src/models/NursingRecord",
  "./src/models/DoctorOrder",
  "./src/models/NursingCarePlan",
  "./src/models/ShiftHandover",
  "./src/models/AuditLog"
];

try {
  models.forEach((modelPath) => {
    const model = require(modelPath);
    console.log(`Loaded: ${model.modelName}`);
  });

  console.log("\nAll 10 models loaded successfully!");
} catch (error) {
  console.error("\nModel loading failed:");
  console.error(error.message);
  process.exitCode = 1;
}
