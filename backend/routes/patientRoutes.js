import express from "express";
import Patient from "../models/Patient.js";
import { predictHealthRisk } from "../services/healthRiskModel.js";

const router = express.Router();

/* =========================================================
   ✅ 1) Register / Add Patient
   POST: /api/patients/
   ========================================================= */
router.post("/", async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();

    res.status(201).json({
      success: true,
      message: "Patient saved successfully",
      patient,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error saving patient",
      error: err.message,
    });
  }
});

/* =========================================================
   ✅ 2) Patient Login (Phone + Password)
   POST: /api/patients/login
   Body: { phone, password }
   ========================================================= */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    // ✅ validations
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone number and password are required",
      });
    }

    // ✅ find patient by phone number
    const patient = await Patient.findOne({ phone });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found with this phone number",
      });
    }

    // ✅ check password (plain text check)
    if (patient.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // ✅ success
    res.status(200).json({
      success: true,
      message: "Login successful",
      patient,
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error while logging in",
      error: error.message,
    });
  }
});

/* =========================================================
   ✅ 3) Fetch Patient by ID (for View details)
   GET: /api/patients/patient/:id
   ========================================================= */
router.get("/patient/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patient details",
      error: error.message,
    });
  }
});

/* =========================================================
   ✅ 4) Update Patient by ID
   PUT: /api/patients/patient/:id
   ========================================================= */
router.put("/patient/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;
    delete updates.updatedAt;

    const patient = await Patient.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating patient details",
      error: error.message,
    });
  }
});

/* =========================================================
   ✅ 5) Update Patient by Phone (fallback)
   PUT: /api/patients/patient-by-phone/:phone
   ========================================================= */
router.put("/patient-by-phone/:phone", async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const updates = { ...req.body };
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;
    delete updates.updatedAt;

    const patient = await Patient.findOneAndUpdate({ phone }, updates, {
      new: true,
      runValidators: true,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating patient details",
      error: error.message,
    });
  }
});

/* =========================================================
   ✅ 6) Fetch Patient by Phone
   GET: /api/patients/patient-by-phone/:phone
   ========================================================= */
router.get("/patient-by-phone/:phone", async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const patient = await Patient.findOne({ phone });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patient details",
      error: error.message,
    });
  }
});

/* =========================================================
   ✅ 7) Doctor patient lookup by phone
   POST: /api/patients/doctor-patient-lookup
   Body: { phone, doctor }
   ========================================================= */
router.post("/doctor-patient-lookup", async (req, res) => {
  try {
    const { phone, doctor } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const patient = await Patient.findOne({ phone });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "No patient details with the mobile number found",
      });
    }

    // Placeholder audit trail in terminal for doctor access.
    console.log("Doctor accessed patient details:", doctor || {});

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching patient details",
      error: error.message,
    });
  }
});

/* =========================================================
   ✅ 8) Predict Health Risk
   POST: /api/patients/predict-health-risk
   Body: { patientId? , phone? , patient? }
   ========================================================= */
router.post("/predict-health-risk", async (req, res) => {
  try {
    const { patientId, phone, patient: rawPatient } = req.body || {};
    let patient = rawPatient || null;

    if (!patient) {
      if (patientId) {
        patient = await Patient.findById(patientId).lean();
      } else if (phone) {
        patient = await Patient.findOne({ phone }).lean();
      }
    }

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: "Patient data, patientId, or phone is required for prediction",
      });
    }

    const prediction = predictHealthRisk(patient);

    res.status(200).json({
      success: true,
      prediction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating health risk prediction",
      error: error.message,
    });
  }
});

export default router;
