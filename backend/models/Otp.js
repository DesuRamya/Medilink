import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  role: { type: String, enum: ["patient", "doctor"], required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

export default mongoose.model("Otp", otpSchema);
