import React, { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "../Styles/ForgotPassword.css";
import { useNavigate, useLocation } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ IMPORTANT: use undefined, not ""
  const [phone, setPhone] = useState(undefined);
  const [error, setError] = useState("");

  // ✅ Role comes automatically from login page
  const role = location.state?.role;

  if (!role) {
    return <p style={{ color: "red" }}>Role not detected. Go back.</p>;
  }

  const handleSendOtp = async () => {
    setError("");

    if (!phone) {
      alert("Mobile number is required");
      return;
    }

    try {
      console.log("OTP Request →", { phone, role });

      const res = await fetch("http://localhost:5050/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, role }) // ✅ MUST be phone
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      navigate("/OtpVerify", {
        state: { phone, role, flow: "forgot" }
      });

    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2>Forgot Password</h2>
        
        <div className="form-row">
        <label className="form-label">Mobile Number</label>

        <div className="phone-input-wrapper">
          <PhoneInput
            defaultCountry="IN"
            value={phone}
            onChange={setPhone}
            className="phone-input"
          />
        </div>
      </div>
        {error && <p className="error-text">{error}</p>}

        <button className="send-otp-btn" onClick={handleSendOtp}>
          Send OTP
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
