
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Institution = require("./src/models/Institution");
const User = require("./src/models/User");
const Ward = require("./src/models/Ward");
const Patient = require("./src/models/Patient");
const Encounter = require("./src/models/Encounter");

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    let institution = await Institution.findOne({
      code: "DEMO-HOSPITAL"
    });

    if (!institution) {
      institution = await Institution.create({
        name: "NurseFlow Demo Hospital",
        code: "DEMO-HOSPITAL",
        status: "active"
      });
    }

    console.log("Institution ready");

    const passwordHash = await bcrypt.hash("Demo@12345", 12);

    const staffMembers = [
      {
        staffId: "ADM001",
        firstName: "Demo",
        lastName: "Admin",
        email: "admin@nurseflow.demo",
        role: "admin"
      },
      {
        staffId: "DOC001",
        firstName: "Demo",
        lastName: "Doctor",
        email: "doctor@nurseflow.demo",
        role: "doctor"
      },
      {
        staffId: "NIC001",
        firstName: "Demo",
        lastName: "NurseInCharge",
        email: "incharge@nurseflow.demo",
        role: "nurse_in_charge"
      },
      {
        staffId: "NUR001",
        firstName: "Demo",
        lastName: "Nurse",
        email: "nurse@nurseflow.demo",
        role: "nurse"
      }
    ];

    for (const staff of staffMembers) {
      const existingUser = await User.findOne({
        institutionId: institution._id,
        staffId: staff.staffId
      });

      if (!existingUser) {
        await User.create({
          ...staff,
          institutionId: institution._id,
          passwordHash,
          status: "active"
        });
      }
    }

    console.log("Staff accounts ready");

    let ward = await Ward.findOne({
      institutionId: institution._id,
      code: "WARD-A"
    });

    if (!ward) {
      ward = await Ward.create({
        institutionId: institution._id,
        name: "General Ward A",
        code: "WARD-A",
        department: "General Medicine",
        floor: "1",
        rooms: [
          {
            roomNumber: "101",
            beds: [
              { bedNumber: "1", status: "occupied" },
              { bedNumber: "2", status: "occupied" },
              { bedNumber: "3", status: "available" }
            ]
          }
        ]
      });
    }

    console.log("Ward ready");

    const patientData = [
      {
        patientId: "PAT001",
        firstName: "Arun",
        lastName: "Demo",
        sex: "male"
      },
      {
        patientId: "PAT002",
        firstName: "Maya",
        lastName: "Demo",
        sex: "female"
      },
      {
        patientId: "PAT003",
        firstName: "Ravi",
        lastName: "Demo",
        sex: "male"
      }
    ];

    const patients = [];

    for (const data of patientData) {
      let patient = await Patient.findOne({
        institutionId: institution._id,
        patientId: data.patientId
      });

      if (!patient) {
        patient = await Patient.create({
          ...data,
          institutionId: institution._id
        });
      }

      patients.push(patient);
    }

    console.log("Patients ready");

    const nurse = await User.findOne({
      institutionId: institution._id,
      staffId: "NUR001"
    });

    const doctor = await User.findOne({
      institutionId: institution._id,
      staffId: "DOC001"
    });

    for (let i = 0; i < patients.length; i++) {
      const encounterNumber = `ENC00${i + 1}`;

      const existingEncounter = await Encounter.findOne({
        institutionId: institution._id,
        encounterNumber
      });

      if (!existingEncounter) {
        await Encounter.create({
          institutionId: institution._id,
          patientId: patients[i]._id,
          encounterNumber,
          encounterType: "inpatient",
          admissionDate: new Date(),
          reason: "Demo admission for workflow testing",
          admittingDoctorId: doctor._id,
          attendingDoctorId: doctor._id,
          wardId: ward._id,
          roomNumber: "101",
          bedNumber: String(i + 1),
          assignedNurseIds: [nurse._id],
          status: "active"
        });
      }
    }

    console.log("Encounters ready");
    console.log("NurseFlow database seeding completed");
    console.log("Demo password: Demo@12345");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();
