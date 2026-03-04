import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/PatientWelcome.css";

const PatientWelcomePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");

useEffect(() => {
  const storedPatient = localStorage.getItem("patientData");

  let patientData = null;
  try {
    if (storedPatient && storedPatient !== "undefined") {
      patientData = JSON.parse(storedPatient);
    }
  } catch (e) {
    patientData = null;
  }
}, []);
  const handleLogout = () => {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientData");
    navigate("/"); // ✅ landing page
  };

  return (
    <div className="pw-bg">
      <div className="pw-card">

        {/* ✅ NAVBAR */}
        <div className="pw-navbar">
          <div className="pw-logo">Medilink</div>

          <div className="pw-menu">
            <span onClick={() => navigate("/patientwelcome")}>home</span>
            <span onClick={() => navigate("/patientdetails")}>View details</span>
            <span onClick={handleLogout}>logout</span>
          </div>
        </div>

        {/* ✅ Divider */}
        <div className="pw-divider"></div>

        {/* ✅ Page Body */}
        <div className="pw-body">
          <div className="pw-left">
            <h2>Welcome, {userName}</h2>

            <h2>About Medilink</h2>

            <p>
              Medilink is a secure healthcare platform that stores and manages
              medical records digitally. It allows authorized doctors to access
              patient information instantly during emergencies.
            </p>
          </div>

          <div className="pw-right">
            <img
              src="https://cdn-icons-png.flaticon.com/512/387/387561.png"
              alt="doctor"
              className="pw-img"
            />
          </div>
        </div>

        {/* ✅ Footer line */}
        <div className="pw-divider"></div>

        <div className="pw-footer">
          © 2026 Medilink. All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default PatientWelcomePage;
