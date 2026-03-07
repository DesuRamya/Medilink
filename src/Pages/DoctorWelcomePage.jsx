import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/PatientWelcome.css";

const DoctorWelcomePage = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Doctor");

  useEffect(() => {
    const storedDoctor = localStorage.getItem("doctorData");
    try {
      const parsedDoctor = storedDoctor ? JSON.parse(storedDoctor) : null;
      if (parsedDoctor?.name) {
        setUserName(parsedDoctor.name);
      }
    } catch {
      setUserName("Doctor");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("doctorToken");
    localStorage.removeItem("doctorId");
    localStorage.removeItem("doctorData");
    navigate("/");
  };

  return (
    <div className="pw-bg">
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

        <div className="pw-divider"></div>

        <div className="pw-footer">© 2026 Medilink. All rights reserved.</div>
      </div>
    </div>
  );
};

export default DoctorWelcomePage;
