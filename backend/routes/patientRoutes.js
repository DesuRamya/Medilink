import express from "express";
import Patient from "../models/Patient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json({ message: "Patient saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
