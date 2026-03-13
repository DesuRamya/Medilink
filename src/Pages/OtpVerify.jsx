import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../Styles/OtpVerify.css";
import { apiUrl } from "../lib/api";

const OtpVerify = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const { phone, role, flow } = location.state || {};

  // Safety guard
  if (!phone || !role) {
    return (
      <div className="otp-container">
        <div className="otp-card">
          <p style={{ color: "red" }}>Session expired. Please try again.</p>
        </div>
      </div>
    );
  }

  const handleVerify = async () => {
    setError("");

    if (!otp) {
      setError("Please enter OTP");
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role, otp })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      navigate("/reset-password", { state: { phone, role, flow } });
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <h2>Verify OTP</h2>

        <p className="otp-info">
          OTP sent to <strong>{phone}</strong>
        </p>

        <input
          type="text"
          className="otp-input"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        {error && <p className="error-text">{error}</p>}

        <button
          className={`verify-btn ${otp ? "active" : ""}`}
          onClick={handleVerify}
          disabled={!otp}
        >
          Verify OTP
        </button>
      </div>
    </div>
  );
};

export default OtpVerify;
