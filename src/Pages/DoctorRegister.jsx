import React, { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "../Styles/DoctorRegister.css";

const DoctorRegister = () => {
  const Navigate = useNavigate();
  const location = useLocation();
  const phoneFromRegistration = location.state?.phone;

  const [form, setForm] = useState({
    doctorId: "",
    name: "",
    hospital: "",
    phone: phoneFromRegistration || ""
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [canSubmit, setCanSubmit] = useState(false);

  // 🔹 Validation logic
  const validate = (data) => {
    const errs = {};

    if (!data.doctorId) {
      errs.doctorId = "Doctor ID is required";
    } else if (!/^\d{12}$/.test(data.doctorId)) {
      errs.doctorId = "Doctor ID must be exactly 12 digits";
    }

    if (!data.name) {
      errs.name = "Doctor name is required";
    }

    if (!data.hospital) {
      errs.hospital = "Hospital name is required";
    }

    if (!data.phone) {
      errs.phone = "Valid mobile number is required";
    }

    return errs;
  };

  // 🔹 Handle input change
  const handleChange = (field, value) => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);

    const validationErrors = validate(updatedForm);
    setErrors(validationErrors);
    setCanSubmit(Object.keys(validationErrors).length === 0);
  };

  // 🔹 Handle blur (mark field as touched)
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // 🔹 Submit handler
  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/doctors/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Doctor registered successfully");
      Navigate("/DoctorWelcome");

      // Optional: reset form
      setForm({
        doctorId: "",
        name: "",
        hospital: "",
        phone: ""
      });
      setErrors({});
      setTouched({});
      setCanSubmit(false);

    } catch (error) {
      alert("Server error");
    }
  };

  return (
    <div className="doctor-container">
      <div className="doctor-card">

        <h2>Doctor Registration</h2>

        {/* Doctor ID */}
        <div className="form-row">
          <label>Doctor ID</label>
          <input
            type="text"
            value={form.doctorId}
            onChange={(e) => handleChange("doctorId", e.target.value)}
            onBlur={() => handleBlur("doctorId")}
          />
        </div>
        {touched.doctorId && errors.doctorId && (
          <p className="error">{errors.doctorId}</p>
        )}

        {/* Name */}
        <div className="form-row">
          <label>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
          />
        </div>
        {touched.name && errors.name && (
          <p className="error">{errors.name}</p>
        )}

        {/* Hospital */}
        <div className="form-row">
          <label>Hospital</label>
          <input
            type="text"
            value={form.hospital}
            onChange={(e) => handleChange("hospital", e.target.value)}
            onBlur={() => handleBlur("hospital")}
          />
        </div>
        {touched.hospital && errors.hospital && (
          <p className="error">{errors.hospital}</p>
        )}

        {/* Mobile */}
        <div className="form-row">
          <label>Mobile</label>
          <PhoneInput                  
            international
            defaultCountry="IN"
            value={form.phone}
            disabled={true}
          />
        </div>
        {touched.phone && errors.phone && (
          <p className="error">{errors.phone}</p>
        )}

        <button
          className={`submit-btn ${canSubmit ? "active" : ""}`}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Submit
        </button>

      </div>
    </div>
  );
};

export default DoctorRegister;
