import express from "express";
import Doctor from "../models/Doctor.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { doctorId, name, hospital, phone } = req.body;

  try {
    if (!doctorId || !name || !hospital || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!/^\d{12}$/.test(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID must be exactly 12 digits"
      });
    }

    const existingDoctor = await Doctor.findOne({
      $or: [{ doctorId }, { phone }]
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor already registered"
      });
    }

    const doctor = new Doctor({
      doctorId,
      name,
      hospital,
      phone
    });

    await doctor.save();

    res.json({
      success: true,
      message: "Doctor registered successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
