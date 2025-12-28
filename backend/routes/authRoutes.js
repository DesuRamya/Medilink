import express from "express";
import bcrypt from "bcryptjs";
import PatientPassword from "../models/PatientPassword.js";
import DoctorPassword from "../models/DoctorPassword.js";
import Otp from "../models/Otp.js";

const router = express.Router();
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.post("/send-otp", async (req, res) => {
  const { phone, role } = req.body;

  if (!phone || !role) {
    return res.status(400).json({ message: "Phone and role are required" });
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

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

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

    // ✅ LOGIN SUCCESS
    res.json({
      success: true,
      message: "Login successful"
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
