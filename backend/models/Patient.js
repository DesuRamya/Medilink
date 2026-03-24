import mongoose from "mongoose";

const PatientSchema = new mongoose.Schema(
  {
    name: String,
    dateOfBirth: String,
    age: Number,
    gender: String,
    bloodGroup: String,

    phone: { type: String, required: true},
    otp: {
  type: String,
  default: null
},
otpExpiresAt: {
  type: Date,
  default: null
},
    alternatePhone: String,

    address: String,
    height: Number,
    weight: Number,

    maritalStatus: String,
    occupation: String,

    hbTestDate: String,
    hemoglobin: Number,

    hasBp: String,
    bpTestDate: String,
    bp: String,

    hasDiabetics: String,
    diabeticTestDate: String,
    diabetic: Number,

    alcoholic: String,
    smoker: String,

    diseases: Object,
    prescriptionImage: String,

    isActive: {
      type: Boolean,
      default: true,
    },

  },
  { timestamps: true }

);

export default mongoose.model("Patient", PatientSchema);
