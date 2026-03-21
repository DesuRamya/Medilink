import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "../Styles/PatientWelcome.css";
import "../Styles/DoctorPatientDetails.css";
import { apiUrl } from "../lib/api";

const DoctorPatientDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState("");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

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

  const prettyLabel = (text) =>
    String(text || "")
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const renderDiseases = (diseases) => {
    if (!diseases || typeof diseases !== "object") return "Not available";

    const entries = Object.entries(diseases).filter(
      ([, list]) => Array.isArray(list) && list.length > 0
    );

    if (entries.length === 0) return "Not available";

    return (
      <div className="pd-disease-list">
        {entries.map(([category, list]) => (
          <div key={category} className="pd-disease-group">
            <span className="pd-disease-category">{prettyLabel(category)}</span>
            <span className="pd-disease-items">{list.join(", ")}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderValue = (key, value) => {
    if (key === "diseases") {
      return renderDiseases(value);
    }

    if (key === "prescriptionImage") {
      const src = String(value || "");
      if (!src) return "Not available";
      return (
        <div className="dpd-prescription-image">
          <img src={apiUrl(src)} alt="Prescription" />
          <button
            type="button"
            className="dpd-prescription-delete"
            onClick={handleDeletePrescriptionImage}
          >
            Delete
          </button>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (value && typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
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
      const response = await fetch(apiUrl("/api/patients/doctor-patient-lookup"), {
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

  useEffect(() => {
    const statePhone = location.state?.phone;
    const statePatient = location.state?.patient;
    if (statePhone && !phone) {
      setPhone(statePhone);
    }
    if (statePatient && !patient) {
      setPatient(statePatient);
    }
  }, [location.state, phone, patient]);

  const handleEdit = () => {
    if (!patient) return;
    navigate("/register/patient", {
      state: { isEdit: true, patient, fromDoctor: true }
    });
  };

  const handleDownloadSummary = async () => {
    if (!patient?._id) {
      alert("Patient information not loaded yet.");
      return;
    }

    try {
      setSummaryLoading(true);
      const response = await fetch(
        apiUrl(`/api/patients/patient/${patient._id}/summary-pdf`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.message || "Failed to generate summary PDF");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Patient_Summary.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading summary PDF");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleDeletePrescriptionImage = async () => {
    if (!patient?._id) return;
    const ok = window.confirm("Delete prescription image?");
    if (!ok) return;

    try {
      const response = await fetch(
        apiUrl(`/api/patients/patient/${patient._id}/prescription-image`),
        { method: "DELETE" }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.message || "Failed to delete prescription image");
        return;
      }
      setPatient(data.patient || { ...patient, prescriptionImage: null });
    } catch (err) {
      alert("Error deleting prescription image");
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
                  <span className="dpd-key">{prettyLabel(key)}</span>
                  <span className="dpd-value">{renderValue(key, value)}</span>
                </div>
              ))}
              <div className="dpd-actions dpd-actions-bottom">
                <button className="dpd-edit-btn" onClick={handleEdit}>
                  Edit Details
                </button>
                <button
                  className="dpd-summary-btn"
                  onClick={handleDownloadSummary}
                  disabled={summaryLoading}
                >
                  {summaryLoading ? "Preparing..." : "Download PDF"}
                </button>
              </div>
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
