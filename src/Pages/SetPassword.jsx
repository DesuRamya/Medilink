import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { apiUrl } from "../lib/api";

const SetPassword = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const role = state?.role;

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [canSubmit, setCanSubmit] = useState(false);

  const validate = (newPhone, newPassword) => {
  if (!newPhone) return false;
  if (!newPassword) return false;
  if (newPassword.length < 6) return false;
  return true;
};


  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      const response = await fetch(apiUrl("/api/password/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          phone,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Request failed");
        return;
      }

      alert("Registration successful");
      if (role === "patient") {
        navigate("/register/patient", {
          state: { phone }
        });
      } else if (role === "doctor") {
        navigate("/register/doctor", { state: { phone } });
      }
    } catch (err) {
      setError("Cannot reach backend. Check server and CORS settings.");
    }
  };

  return (
    <div className="doctor-container">
      <div className="doctor-card">
        <h2>{role === "patient" ? "Patient" : "Doctor"} Registration</h2>

        <div className="form-row">
          <label>Mobile Number</label>
          <PhoneInput
            international
            defaultCountry="IN"
            value={phone}
             onChange={(value) => {
                setPhone(value);
                setCanSubmit(validate(value, password));
            }}
          />
        </div>

        <div className="form-row">
          <label>Password</label>
          <input
            type="password"
            value={password}
             onChange={(e) => {
                const newPassword = e.target.value;
                setPassword(newPassword);
                setCanSubmit(validate(phone, newPassword));
            }}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button
          className={`submit-btn ${canSubmit ? "active" : ""}`}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default SetPassword;
