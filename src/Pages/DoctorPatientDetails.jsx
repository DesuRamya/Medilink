import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "../Styles/PatientWelcome.css";
import "../Styles/DoctorPatientDetails.css";

const DoctorPatientDetails = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  const hiddenKeys = new Set([
    "_id",
    "__v",
    "createdAt",
    "updatedAt",
    "otp",
    "otpExpiresAt"
  ]);

  const hasDisplayValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  };

  const displayEntries = patient
    ? Object.entries(patient).filter(
        ([key, value]) => !hiddenKeys.has(key) && hasDisplayValue(value)
      )
    : [];

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    localStorage.removeItem("doctorId");
    localStorage.removeItem("doctorData");
    navigate("/");
  };

  const handleSearch = async () => {
    if (!phone) {
      alert("Please enter mobile number");
      return;
    }

    const doctorDataRaw = localStorage.getItem("doctorData");
    let doctorData = null;
    try {
      doctorData = doctorDataRaw ? JSON.parse(doctorDataRaw) : null;
    } catch {
      doctorData = null;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5050/api/patients/doctor-patient-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          doctor: doctorData || {}
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) {
          alert("No patient details with the mobile number found");
          setPatient(null);
          return;
        }
        alert(data.message || "Failed to fetch patient details");
        return;
      }

      setPatient(data.patient || null);
    } catch (error) {
      alert("Server error while fetching patient details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dpd-page">
      <div className="pw-card">
        <div className="pw-navbar">
          <div className="pw-logo">Medilink</div>
          <div className="pw-menu">
            <span onClick={() => navigate("/doctor-welcome")}>home</span>
            <span onClick={() => navigate("/doctor/patient-details")}>View Patient Details</span>
            <span onClick={handleLogout}>logout</span>
          </div>
        </div>

        <div className="pw-divider"></div>

        <div className="dpd-content">
          <h2 className="dpd-title">Find Patient Details</h2>

          <div className="dpd-form">
            <div className="dpd-form-row">
              <label className="dpd-label">Mobile Number</label>
              <div className="dpd-input-wrap">
                <PhoneInput
                  international
                  defaultCountry="IN"
                  value={phone}
                  onChange={setPhone}
                />
              </div>
            </div>
            <button className="dpd-btn" onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {patient && (
            <div className="dpd-box">
              {displayEntries.map(([key, value]) => (
                <div className="dpd-row" key={key}>
                  <span className="dpd-key">{key}</span>
                  <span className="dpd-value">
                    {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pw-divider"></div>
        <div className="pw-footer">© 2026 Medilink. All rights reserved.</div>
      </div>
    </div>
  );
};

export default DoctorPatientDetails;
