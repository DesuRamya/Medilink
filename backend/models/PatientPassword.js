import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const patientPasswordSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

patientPasswordSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("PatientPassword", patientPasswordSchema);
