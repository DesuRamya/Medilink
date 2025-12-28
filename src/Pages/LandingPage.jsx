import React from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container">

      {/* Header */}
      <header className="header">
        <h1 className="logo">Medilink</h1>

        {/* Only navigation */}
        <button
          className="auth-btn"
          onClick={() => navigate("/login")}
        >
          Login / Signup
        </button>
      </header>

      {/* Main */}
      <main className="main">
        <div className="about-section">
          <h2>About Medilink</h2>
          <p>
           Medilink is a secure healthcare platform that stores and manages
            medical records digitally. It allows authorized doctors to
            access patient information instantly during emergencies.
          </p>
        </div>

        <div className="image-section">
          <img
            src="https://cdn-icons-png.flaticon.com/512/387/387561.png"
            alt="Doctors"
            className="doctor-image"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        © 2025 Medilink. All rights reserved.
      </footer>

    </div>
  );
};

export default LandingPage;
