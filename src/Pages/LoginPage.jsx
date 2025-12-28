import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "../Styles/LoginPage.css";

const Login = () => {
  const [role, setRole] = useState("patient");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!mobile || !password) {
      alert("Please enter all fields");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            phone: mobile,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      // ✅ Login successful
      navigate("/welcome");

    } catch (error) {
      alert("Server error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">

        <h2>Login</h2>

        {/* Role Selector */}
        <div className="role-toggle">
          <button
            className={role === "patient" ? "active" : ""}
            onClick={() => setRole("patient")}
          >
            Patient
          </button>
          <button
            className={role === "doctor" ? "active" : ""}
            onClick={() => setRole("doctor")}
          >
            Doctor
          </button>
        </div>

        {/* Mobile Number */}
        <div className="form-row">
          <label className="form-label">Mobile Number</label>
          <div className="form-input">
            <PhoneInput
              international
              defaultCountry="IN"
              value={mobile}
              onChange={setMobile}
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-row">
          <label className="form-label">Password</label>
          <div className="form-input">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <p
          className="forgot-password"
          onClick={() => navigate("/forgot-password", { state: { role } })}
        >
          Forgot password?
        </p>

        {/* Submit */}
        <button
          className="submit-btn"
          disabled={!mobile || !password}
          onClick={handleLogin}
        >
          Submit
        </button>

        {/* Register */}
        <p className="register">
          New user?{" "}
          <span
            onClick={() => {
              if (role === "patient") {
                navigate("/register/password", { state: { role: "patient" } });
              } else {
                navigate("/register/password", { state: { role: "doctor" } });
              }
            }}
          >
            Register
          </span>
        </p>

      </div>
    </div>
  );
};

export default Login;
