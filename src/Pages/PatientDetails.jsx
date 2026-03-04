import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/PatientDetails.css";

const PatientDetails = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const patientId = localStorage.getItem("patientId");

    // ✅ If patient not logged in redirect to login
    if (!patientId) {
      navigate("/patientlogin");
      return;
    }

    // ✅ Fetch patient details from backend API
const fetchPatientDetails = async () => {
  const patientId = localStorage.getItem("patientId");

  console.log("patientId from localStorage:", patientId);

  if (!patientId || patientId === "undefined") {
    alert("Patient not logged in properly. Please login again.");
    navigate("/login");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/patients/patient/${patientId}`
    );

    const text = await response.text(); // ✅ read response safely

    if (!response.ok) {
      console.log("Backend Error Response:", text);
      throw new Error("Backend server error");
    }

    const data = JSON.parse(text); // ✅ now parse JSON safely
    setPatient(data.patient); // because response is {success:true, patient: {...}}
  } catch (err) {
    console.log(err);
    alert("Error fetching patient details");
  }
};

    fetchPatientDetails();
  }, [navigate]);

  return (
    <div className="pd-container">
      <h2 className="pd-heading">Patient Details</h2>

      {/* ✅ Loading state */}
      {loading && <p className="pd-loading">Loading patient details...</p>}

      {/* ✅ After loading, show details */}
      {!loading && patient && (
        <div className="pd-box">
          {Object.entries(patient).map(([key, value]) => (
            <div className="pd-row" key={key}>
              <span className="pd-key">{key}</span>
              <span className="pd-value">{String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ✅ No data */}
      {!loading && !patient && (
        <p className="pd-loading">No details found for this patient.</p>
      )}
    </div>
  );
};

export default PatientDetails;
