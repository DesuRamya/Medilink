import express from "express";
import PatientPassword from "../models/PatientPassword.js";
import DoctorPassword from "../models/DoctorPassword.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { role, phone, password } = req.body;

  if (!role || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  try {
    if (role === "patient") {
      const exists = await PatientPassword.findOne({ phone });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Patient password already set"
        });
      }

      await new PatientPassword({ phone, password }).save();
    }

    if (role === "doctor") {
      const exists = await DoctorPassword.findOne({ phone });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Doctor password already set"
        });
      }

      await new DoctorPassword({ phone, password }).save();
    }

    res.json({
      success: true,
      message: "Password registered successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
