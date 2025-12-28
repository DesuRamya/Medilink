import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{12}$/   // exactly 12 digits
  },
  name: {
    type: String,
    required: true
  },
  hospital: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  }
});

export default mongoose.model("Doctor", doctorSchema);
