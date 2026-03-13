import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styles/DoctorRegister.css";
import { apiUrl } from "../lib/api";

const ResetPassword = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const phone = state?.phone;
  const role = state?.role;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (!password || !confirmPassword) return false;
    if (password.length < 6) return false;
    if (password !== confirmPassword) return false;
    return true;
  }, [password, confirmPassword]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const resetRes = await fetch(apiUrl("/api/password/reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, phone, password })
      });

      const resetRaw = await resetRes.text();
      let resetData = {};
      try {
        resetData = resetRaw ? JSON.parse(resetRaw) : {};
      } catch {
        resetData = { message: `Non-JSON response (${resetRes.status})` };
      }
      if (!resetRes.ok) {
        setError(resetData.message || "Failed to reset password");
        setSubmitting(false);
        return;
      }

      localStorage.removeItem("patientToken");
      localStorage.removeItem("patientId");
      localStorage.removeItem("patientData");
      localStorage.removeItem("doctorToken");
      localStorage.removeItem("doctorId");
      localStorage.removeItem("doctorData");

      const loginRes = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, phone, password })
      });

      const loginRaw = await loginRes.text();
      let loginData = {};
      try {
        loginData = loginRaw ? JSON.parse(loginRaw) : {};
      } catch {
        loginData = { message: `Non-JSON response (${loginRes.status})` };
      }
      if (!loginRes.ok) {
        setError(loginData.message || "Password reset succeeded, but login failed");
        setSubmitting(false);
        return;
      }

      localStorage.setItem("role", role);

      if (role === "patient") {
        if (!loginData.patient || !loginData.patient._id) {
          alert("Password reset. Please complete patient profile.");
          navigate("/register/patient", { state: { phone } });
          return;
        }

        localStorage.setItem("patientToken", "true");
        localStorage.setItem("patientId", loginData.patient._id);
        localStorage.setItem("patientData", JSON.stringify(loginData.patient));
        navigate("/patient-welcome");
        return;
      }

      if (role === "doctor") {
        if (!loginData.doctor || !loginData.doctor._id) {
          alert("Password reset. Please complete doctor profile.");
          navigate("/register/doctor", { state: { phone } });
          return;
        }

        localStorage.setItem("doctorToken", "true");
        localStorage.setItem("doctorId", loginData.doctor._id);
        localStorage.setItem("doctorData", JSON.stringify(loginData.doctor));
        navigate("/doctor-welcome");
        return;
      }

      navigate("/login");
    } catch (err) {
      setError(err?.message || "Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!phone || !role) {
    return (
      <div className="doctor-container">
        <div className="doctor-card">
          <h2>Reset Password</h2>
          <p style={{ color: "red" }}>Session expired. Please start again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-container">
      <div className="doctor-card">
        <h2>Reset Password</h2>

        <div className="form-row">
          <label>New Password</label>
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

        <div className="form-row">
          <label>Confirm Password</label>
          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <button
          className={`submit-btn ${canSubmit ? "active" : ""}`}
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
