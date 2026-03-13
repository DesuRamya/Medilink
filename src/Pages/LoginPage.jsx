import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "../Styles/LoginPage.css";
import { apiUrl } from "../lib/api";

const Login = () => {
  const [role, setRole] = useState("patient");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!mobile || !password) {
      alert("Please enter all fields");
      return;
    }

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          phone: mobile,
          password,
        }),
      });

      const data = await response.json();
      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // Store role
      localStorage.setItem("role", role);

      // ================= PATIENT =================
      if (role === "patient") {
        if (!data.patient || !data.patient._id) {
          alert("Password verified. Please complete patient profile.");
          navigate("/register/patient", { state: { phone: mobile } });
          return;
        }

        localStorage.setItem("patientToken", "true");
        localStorage.setItem("patientId", data.patient._id);
        localStorage.setItem(
          "patientData",
          JSON.stringify(data.patient)
        );

        navigate("/patient-welcome");
      }

      // ================= DOCTOR =================
      else {
        if (!data.doctor || !data.doctor._id) {
          alert("Password verified. Please complete doctor profile.");
          navigate("/register/doctor", { state: { phone: mobile } });
          return;
        }

        localStorage.setItem("doctorToken", "true");
        localStorage.setItem("doctorId", data.doctor._id);
        localStorage.setItem(
          "doctorData",
          JSON.stringify(data.doctor)
        );

        navigate("/doctor-welcome");
      }
    } catch (error) {
      console.log("LOGIN ERROR:", error);
      alert("Server error. Please try again.");
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
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>
        </div>

        <p
          className="forgot-password"
          onClick={() =>
            navigate("/forgot-password", { state: { role } })
          }
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
            onClick={() =>
              navigate("/register/password", {
                state: { role },
              })
            }
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
