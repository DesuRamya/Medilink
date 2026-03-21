import express from "express";
import Patient from "../models/Patient.js";
import { predictHealthRisk } from "../services/healthRiskModel.js";
import { generatePatientSummaryPdf } from "../services/patientSummaryPdf.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads", "prescriptions");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext && ext.length <= 10 ? ext : "";
    cb(null, `patient_${req.params.id}_${Date.now()}${safeExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/* =========================================================
   ✅ 1) Register / Add Patient
   POST: /api/patients/
   ========================================================= */
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };
    delete payload.prescriptions;
    const patient = new Patient(payload);
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
    delete updates.prescriptions;

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: updates, $unset: { prescriptions: "" } },
      {
        new: true,
        runValidators: true,
      }
    );

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
    delete updates.prescriptions;

    const patient = await Patient.findOneAndUpdate(
      { phone },
      { $set: updates, $unset: { prescriptions: "" } },
      {
        new: true,
        runValidators: true,
      }
    );

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

/* =========================================================
   ✅ 9) Download Patient Summary PDF (Time Window)
   POST: /api/patients/patient/:id/summary-pdf
   Body: { fromDate, toDate }
   ========================================================= */
router.post("/patient/:id/summary-pdf", async (req, res) => {
  try {
    const { fromDate, toDate } = req.body || {};
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (fromDate && Number.isNaN(from.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format for fromDate",
      });
    }
    if (toDate && Number.isNaN(to.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format for toDate",
      });
    }
    if (from && to && from > to) {
      return res.status(400).json({
        success: false,
        message: "fromDate must be earlier than or equal to toDate",
      });
    }

    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const rangeEnabled = Boolean(fromDate || toDate);
    const effectiveFrom = fromDate || null;
    const effectiveTo = toDate || null;

    const pdfBuffer = await generatePatientSummaryPdf(patient, {
      fromDate: effectiveFrom,
      toDate: effectiveTo,
    });
    const filename = rangeEnabled
      ? `Patient_Summary_${effectiveFrom}_to_${effectiveTo}.pdf`
      : "Patient_Summary.pdf";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error generating summary PDF",
      error: error.message,
    });
  }
});

/* =========================================================
   ✅ 10) Upload Prescription Image (Doctor)
   POST: /api/patients/patient/:id/prescription-image
   FormData: { image }
   ========================================================= */
router.post("/patient/:id/prescription-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const existing = await Patient.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (existing.prescriptionImage) {
      const oldPath = existing.prescriptionImage.startsWith("/")
        ? existing.prescriptionImage.slice(1)
        : existing.prescriptionImage;
      const absoluteOldPath = path.join(__dirname, "..", oldPath);
      if (fs.existsSync(absoluteOldPath)) {
        fs.unlinkSync(absoluteOldPath);
      }
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { prescriptionImage: `/uploads/prescriptions/${req.file.filename}` },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Prescription image uploaded",
      patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error uploading prescription image",
      error: error.message,
    });
  }
});

/* =========================================================
   ✅ 11) Delete Prescription Image
   DELETE: /api/patients/patient/:id/prescription-image
   ========================================================= */
router.delete("/patient/:id/prescription-image", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (patient.prescriptionImage) {
      const relativePath = patient.prescriptionImage.startsWith("/")
        ? patient.prescriptionImage.slice(1)
        : patient.prescriptionImage;
      const absolutePath = path.join(__dirname, "..", relativePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: { prescriptionImage: null }, $unset: { prescriptions: "" } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Prescription image deleted",
      patient: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting prescription image",
      error: error.message,
    });
  }
});

export default router;
