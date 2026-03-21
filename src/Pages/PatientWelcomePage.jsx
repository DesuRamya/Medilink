import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/PatientWelcome.css";

const PatientWelcomePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [menuOpen, setMenuOpen] = useState(false);

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

    const name = patientData?.name?.trim();
    setUserName(name || "User");
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientId");
    localStorage.removeItem("patientData");
    navigate("/"); // ✅ landing page
  };

  return (
    <div className="pw-bg">
      <div className="pw-card">
        <div className={`pw-menu-overlay ${menuOpen ? "" : "hidden"}`}>
          <div className="pw-menu-panel">
            <div className="pw-menu-header">
              <div className="pw-menu-title">Menu</div>
              <button
                type="button"
                className="pw-menu-close"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <div className="pw-menu-items">
              <span className="pw-menu-item" onClick={() => navigate("/patient-welcome")}>
                Home
              </span>
              <span className="pw-menu-item" onClick={() => navigate("/patientdetails")}>
                View details
              </span>
              <span className="pw-menu-item" onClick={handleLogout}>
                Logout
              </span>
            </div>
          </div>
        </div>

        {/* ✅ NAVBAR */}
        <div className="pw-navbar">
          <div className="pw-logo">Medilink</div>

          <button
            type="button"
            className="pw-menu-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span />
          </button>
          <div className={`pw-menu ${menuOpen ? "pw-menu--open" : ""}`}>
            <span onClick={() => navigate("/patient-welcome")}>home</span>
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
