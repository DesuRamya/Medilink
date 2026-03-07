import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/PatientWelcome.css";
import "../Styles/PatientHealthRiskPage.css";

const PatientHealthRiskPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [patient, setPatient] = useState(location.state?.patient || null);
  const [prediction, setPrediction] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(!location.state?.patient);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [error, setError] = useState("");

  const prettyLabel = (text) =>
    String(text || "")
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleLogout = () => {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientId");
    localStorage.removeItem("patientData");
    navigate("/");
  };

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
      throw new Error("Patient not logged in properly. Please login again.");
    }

    const endpoint =
      patientId && patientId !== "undefined"
        ? `http://localhost:5050/api/patients/patient/${patientId}`
        : `http://localhost:5050/api/patients/patient-by-phone/${encodeURIComponent(patientPhone)}`;

    const response = await fetch(endpoint);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error fetching patient details");
    }

    return data.patient || null;
  };

  const fetchPrediction = async (patientData) => {
    if (!patientData) return;

    setLoadingPrediction(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5050/api/patients/predict-health-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientData._id,
          patient: patientData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to predict health risk");
      }

      setPrediction(data.prediction || null);
    } catch (err) {
      setError(err.message || "Unable to generate prediction");
      setPrediction(null);
    } finally {
      setLoadingPrediction(false);
    }
  };

  const renderReason = (reason) => {
    if (typeof reason !== "string") return String(reason);

    const colonIndex = reason.indexOf(":");
    if (colonIndex <= 0) return reason;

    const reasonKey = reason.slice(0, colonIndex).trim();
    const reasonValue = reason.slice(colonIndex + 1).trim();
    if (!reasonValue) return reason;

    const diseaseEntries = reasonValue
      .split(/,\s*(?=[A-Za-z_ ]+\s*:)/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((entry) => {
        const splitIndex = entry.indexOf(":");
        if (splitIndex <= 0) return null;

        return {
          key: prettyLabel(entry.slice(0, splitIndex).trim()),
          value: entry.slice(splitIndex + 1).trim(),
        };
      })
      .filter((item) => item && item.value);

    if (reasonKey.toLowerCase().includes("existing disease entries") && diseaseEntries.length > 0) {
      return (
        <div className="prp-inline-disease-list">
          {diseaseEntries.map((entry, idx) => (
            <div className="prp-disease-group" key={`reason-disease-${idx}`}>
              <span className="prp-disease-category">{entry.key}</span>
              <span className="prp-disease-items">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <span className="prp-reason-kv">
        <span className="prp-reason-key">{prettyLabel(reasonKey)}</span>
        <span className="prp-reason-value">{reasonValue}</span>
      </span>
    );
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        let activePatient = patient;

        if (!activePatient) {
          activePatient = await fetchPatientDetails();
          setPatient(activePatient);
        }

        await fetchPrediction(activePatient);
      } catch (err) {
        setError(err.message || "Unable to load patient data");
      } finally {
        setLoadingPatient(false);
      }
    };

    initialize();
  }, []);

  return (
    <div className="prp-page">
      <div className="prp-header-fixed">
        <div className="pw-navbar prp-navbar">
          <div className="pw-logo">Medilink</div>
          <div className="pw-menu">
            <span onClick={() => navigate("/patient-welcome")}>home</span>
            <span onClick={() => navigate("/patientdetails")}>View details</span>
            <span className="prp-active-menu">Health Risk</span>
            <span onClick={handleLogout}>logout</span>
          </div>
        </div>
        <div className="pw-divider"></div>
      </div>

      <div className="prp-content-wrap">
        <div className="prp-content">
          <h2 className="prp-heading">Health Risk Prediction</h2>

          {(loadingPatient || loadingPrediction) && (
            <p className="prp-loading">Generating prediction...</p>
          )}

          {error && <p className="prp-error">{error}</p>}

          {!loadingPatient && !loadingPrediction && !error && prediction && (
            <>
              <div className="prp-summary">
                {prediction.inputsUsed && (
                  <>
                    <p>
                      <strong>Age Used:</strong> {prediction.inputsUsed.age}
                    </p>
                    <p>
                      <strong>BP Used:</strong> {prediction.inputsUsed.bp} (Has BP:{" "}
                      {prediction.inputsUsed.hasBp})
                    </p>
                    <p>
                      <strong>Diabetes Used:</strong> {prediction.inputsUsed.diabetic} (Has Diabetes:{" "}
                      {prediction.inputsUsed.hasDiabetics})
                    </p>
                    <p>
                      <strong>Hemoglobin Used:</strong> {prediction.inputsUsed.hemoglobin}
                    </p>
                  </>
                )}
                <p>
                  <strong>Urgency:</strong> {prediction.overallUrgency}
                </p>
                <p>
                  <strong>Immediate Appointment Needed:</strong>{" "}
                  {prediction.needsImmediateMedicalAppointment ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Recommendation:</strong> {prediction.recommendation}
                </p>
              </div>

              <div className="prp-risk-list">
                {(prediction.predictions || []).map((item, index) => (
                  <div className="prp-risk-item" key={`${item.condition}-${index}`}>
                    <p>
                      <strong>{item.condition}</strong> ({item.riskPercentage}% risk)
                    </p>
                    <p>
                      <strong>Urgency:</strong> {item.urgency}
                    </p>
                    <p>{item.details}</p>
                    {Array.isArray(item.reasons) && item.reasons.length > 0 && (
                      <div className="prp-why-wrap">
                        <strong>
                          {String(item.condition || "").toLowerCase().includes("existing conditions")
                            ? "Diseases Specified:"
                            : "Why:"}
                        </strong>
                        <ul className="prp-why-list">
                          {item.reasons.map((reason, reasonIndex) => (
                            <li key={`${item.condition}-reason-${reasonIndex}`}>{renderReason(reason)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className="prp-disclaimer">{prediction.disclaimer}</p>
            </>
          )}

          <div className="prp-actions">
            <button className="prp-btn-secondary" onClick={() => navigate("/patientdetails")}>
              Back to Details
            </button>
            <button
              className="prp-btn-primary"
              onClick={() => fetchPrediction(patient)}
              disabled={loadingPrediction || !patient}
            >
              {loadingPrediction ? "Refreshing..." : "Refresh Prediction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientHealthRiskPage;
