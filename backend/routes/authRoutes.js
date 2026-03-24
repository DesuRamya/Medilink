import express from "express";
import bcrypt from "bcryptjs";
import PatientPassword from "../models/PatientPassword.js";
import DoctorPassword from "../models/DoctorPassword.js";
import Otp from "../models/Otp.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import AuditLog from "../models/AuditLog.js";

const router = express.Router();
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const logLogin = async ({ role, user, phone }) => {
  try {
    const targetId = user && user._id ? String(user._id) : `phone:${phone}`;
    await AuditLog.create({
      actorType: role,
      actorId: user && user._id ? String(user._id) : null,
      action: "login",
      targetType: role,
      targetId,
      meta: { phone },
    });
  } catch (error) {
    console.error("Audit log error:", error?.message || error);
  }
};

router.post("/send-otp", async (req, res) => {
  try {
    const { phone, role } = req.body;

    if (!phone || !role) {
      return res.status(400).json({ message: "Phone and role are required" });
    }

    if (role !== "patient" && role !== "doctor") {
      return res.status(400).json({ message: "Invalid role" });
    }

    let user;
    if (role === "patient") {
      user = await PatientPassword.findOne({ phone });
    } else {
      user = await DoctorPassword.findOne({ phone });
    }

    if (!user) {
      return res.status(400).json({ message: "Mobile number not registered" });
    }

    const otp = generateOtp();

    await Otp.findOneAndUpdate(
      { phone, role },
      { otp, phone, role, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      { upsert: true }
    );

    console.log("🔐 OTP SENT");
    console.log("Role :", role);
    console.log("Phone:", phone);
    console.log("OTP  :", otp);

    res.json({ success: true });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/login", async (req, res) => {
  const { role, phone, password } = req.body;

  if (!role || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  try {
    let user;

    // 🔹 ROLE BASED COLLECTION CHECK
    if (role === "patient") {
      user = await PatientPassword.findOne({ phone });
    } else if (role === "doctor") {
      user = await DoctorPassword.findOne({ phone });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    // ❌ Mobile not registered
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Mobile number not registered"
      });
    }

    // ❌ Password mismatch
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password"
      });
    }

    if (role === "patient") {
      const patient = await Patient.findOne({ phone });
      if (patient && patient.isActive === false) {
        return res.status(403).json({
          success: false,
          message: "Patient account is disabled"
        });
      }
      await logLogin({ role: "patient", user: patient, phone });
      return res.json({
        success: true,
        message: "Login successful",
        patient: patient || { phone }
      });
    }

    const doctor = await Doctor.findOne({ phone });
    if (doctor && doctor.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Doctor account is disabled"
      });
    }
    await logLogin({ role: "doctor", user: doctor, phone });
    return res.json({
      success: true,
      message: "Login successful",
      doctor: doctor || { phone }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { phone, role, otp } = req.body;

  if (!phone || !role || !otp) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const record = await Otp.findOne({ phone, role });

  if (!record) {
    return res.status(400).json({ message: "Session expired" });
  }

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ phone, role });
    return res.status(400).json({ message: "OTP expired" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  await Otp.deleteOne({ phone, role });

  return res.json({ success: true });
});


export default router;
