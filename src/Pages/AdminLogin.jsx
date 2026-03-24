import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/AdminPortal.css";
import { apiUrl } from "../lib/api";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    setBusy(true);
    try {
      const endpoint = mode === "setup" ? "/api/admin/setup" : "/api/admin/login";
      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Request failed");
        return;
      }

      if (mode === "setup") {
        alert("Admin created. Please log in.");
        setMode("login");
        setPassword("");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.admin));
      navigate("/admin");
    } catch (error) {
      alert("Server error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-card">
        <h2>{mode === "setup" ? "Admin Setup" : "Admin Login"}</h2>
        <p className="admin-subtitle">
          {mode === "setup"
            ? "Create the first admin account."
            : "Access the Medilink admin portal."}
        </p>

        <div className="admin-form">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <button className="admin-primary" onClick={submit} disabled={busy}>
            {busy ? "Please wait..." : mode === "setup" ? "Create Admin" : "Login"}
          </button>
        </div>

        <button
          className="admin-link"
          onClick={() => setMode(mode === "setup" ? "login" : "setup")}
        >
          {mode === "setup" ? "Back to login" : "First time? Create admin"}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
