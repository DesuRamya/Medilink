import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/PatientDetails.css";
import "../Styles/PatientWelcome.css";

const PatientDetails = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
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
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientId");
    localStorage.removeItem("patientData");
    navigate("/");
  };


  useEffect(() => {
    const fetchPatientDetails = async () => {
      const patientId = localStorage.getItem("patientId");
      const rawPatientData = localStorage.getItem("patientData");

      let patientPhone = "";
      try {
        const parsed = rawPatientData ? JSON.parse(rawPatientData) : null;
        patientPhone = parsed?.phone || "";
      } catch {
        patientPhone = "";
      }

      if ((!patientId || patientId === "undefined") && !patientPhone) {
        alert("Patient not logged in properly. Please login again.");
        navigate("/login");
        return;
      }

      try {
        const endpoint =
          patientId && patientId !== "undefined"
            ? `http://localhost:5050/api/patients/patient/${patientId}`
            : `http://localhost:5050/api/patients/patient-by-phone/${encodeURIComponent(patientPhone)}`;

        const response = await fetch(endpoint);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Backend server error");
        }

        setPatient(data.patient || null);
      } catch (err) {
        console.log(err);
        alert("Error fetching patient details");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetails();
  }, [navigate]);

  return (
    <div className="pd-container">
      <div className="pw-navbar">
        <div className="pw-logo">Medilink</div>
        <div className="pw-menu">
          <span onClick={() => navigate("/patient-welcome")}>home</span>
          <span onClick={() => navigate("/patientdetails")}>View details</span>
          <span onClick={handleLogout}>logout</span>
        </div>
      </div>

      <div className="pw-divider"></div>

      <div className="pd-content">
        <h2 className="pd-heading">Patient Details</h2>

        {/* ✅ Loading state */}
        {loading && <p className="pd-loading">Loading patient details...</p>}

        {/* ✅ After loading, show details */}
        {!loading && patient && (
          <div className="pd-box">
            {displayEntries.map(([key, value]) => (
              <div className="pd-row" key={key}>
                <span className="pd-key">{key}</span>
                <span className="pd-value">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
            <div className="pd-actions">
              <button
                className="pd-edit-btn"
                onClick={() =>
                  navigate("/register/patient", {
                    state: { isEdit: true, patient, phone: patient.phone }
                  })
                }
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* ✅ No data */}
        {!loading && (!patient || displayEntries.length === 0) && (
          <p className="pd-loading">No details found for this patient.</p>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;
