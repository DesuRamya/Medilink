import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/AdminPortal.css";
import { apiUrl } from "../lib/api";

const getToken = () => localStorage.getItem("adminToken") || "";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("users");
  const [role, setRole] = useState("patient");
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState({});
  const [resetNotice, setResetNotice] = useState("");

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    }),
    []
  );

  const filteredLogs = useMemo(() => {
    const term = logSearch.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) => {
      const parts = [
        log.action,
        log.actorType,
        log.actorId,
        log.targetType,
        log.targetId,
        JSON.stringify(log.meta || {}),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return parts.includes(term);
    });
  }, [logs, logSearch]);

  const ensureAuth = () => {
    if (!getToken()) {
      navigate("/admin/login");
      return false;
    }
    return true;
  };

  const loadUsers = async () => {
    if (!ensureAuth()) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/users?role=${role}`), {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to load users");
        return;
      }
      setUsers(data.users || []);
    } catch (error) {
      alert("Server error while loading users");
    } finally {
      setBusy(false);
    }
  };

  const loadRecords = async () => {
    if (!ensureAuth()) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/admin/records/patients"), {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to load records");
        return;
      }
      setRecords(data.records || []);
    } catch (error) {
      alert("Server error while loading records");
    } finally {
      setBusy(false);
    }
  };

  const loadAudit = async () => {
    if (!ensureAuth()) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/admin/audit"), {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to load audit logs");
        return;
      }
      setLogs(data.logs || []);
    } catch (error) {
      alert("Server error while loading audit logs");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "records") loadRecords();
    if (tab === "audit") loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, role]);

  const toggleActive = async (id, active) => {
    if (!ensureAuth()) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${role}/${id}/active`), {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ active }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to update status");
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: active } : u))
      );
    } catch (error) {
      alert("Server error while updating user");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (id) => {
    if (!ensureAuth()) return;
    setBusy(true);
    setResetNotice("");
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${role}/${id}/reset-password`), {
        method: "POST",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to reset password");
        return;
      }
      setResetNotice(`Temporary password: ${data.tempPassword}`);
    } catch (error) {
      alert("Server error while resetting password");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (record) => {
    setEditId(record._id);
    setEditForm({
      name: record.name || "",
      phone: record.phone || "",
      address: record.address || "",
      bloodGroup: record.bloodGroup || "",
    });
  };

  const saveEdit = async () => {
    if (!ensureAuth()) return;
    if (!editId) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/records/patients/${editId}`), {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to update record");
        return;
      }
      setRecords((prev) =>
        prev.map((r) => (r._id === editId ? data.record : r))
      );
      setEditId("");
      setEditForm({});
    } catch (error) {
      alert("Server error while updating record");
    } finally {
      setBusy(false);
    }
  };

  const deleteRecord = async (id) => {
    if (!ensureAuth()) return;
    if (!confirm("Delete this patient record?")) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/records/patients/${id}`), {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to delete record");
        return;
      }
      setRecords((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      alert("Server error while deleting record");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    if (!ensureAuth()) return;
    try {
      await fetch(apiUrl("/api/admin/logout"), {
        method: "POST",
        headers: authHeaders,
      });
    } catch (error) {
      // ignore
    } finally {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      navigate("/admin/login");
    }
  };

  const exportAuditCsv = () => {
    const rows = [
      ["action", "actorType", "actorId", "targetType", "targetId", "timestamp", "meta"],
      ...filteredLogs.map((log) => [
        log.action || "",
        log.actorType || "",
        log.actorId || "",
        log.targetType || "",
        log.targetId || "",
        log.createdAt ? new Date(log.createdAt).toISOString() : "",
        JSON.stringify(log.meta || {}),
      ]),
    ];

    const escape = (value) => {
      const str = String(value ?? "");
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medilink_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h2>Admin Portal</h2>
          <p>Manage users, records, and audit logs.</p>
        </div>
        <button className="admin-secondary" onClick={logout}>
          Logout
        </button>
      </header>

      <div className="admin-tabs">
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>
          Users
        </button>
        <button className={tab === "records" ? "active" : ""} onClick={() => setTab("records")}>
          Records
        </button>
        <button className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}>
          Audit Logs
        </button>
      </div>

      {tab === "users" && (
        <section className="admin-section">
          <div className="admin-toolbar">
            <div className="role-toggle">
              <button className={role === "patient" ? "active" : ""} onClick={() => setRole("patient")}>
                Patients
              </button>
              <button className={role === "doctor" ? "active" : ""} onClick={() => setRole("doctor")}>
                Doctors
              </button>
            </div>
            {resetNotice && <div className="admin-notice">{resetNotice}</div>}
          </div>

          <div className="admin-table">
            <div className="admin-row admin-head">
              <div>Name</div>
              <div>Phone</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            {users.map((user) => (
              <div className="admin-row" key={user._id}>
                <div>{user.name || "—"}</div>
                <div>{user.phone || "—"}</div>
                <div className={user.isActive ? "status active" : "status inactive"}>
                  {user.isActive ? "Active" : "Disabled"}
                </div>
                <div className="admin-actions">
                  <button
                    className="admin-secondary"
                    onClick={() => toggleActive(user._id, !user.isActive)}
                    disabled={busy}
                  >
                    {user.isActive ? "Disable" : "Enable"}
                  </button>
                  <button className="admin-primary" onClick={() => resetPassword(user._id)} disabled={busy}>
                    Reset Password
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="admin-empty">No users found.</p>}
          </div>
        </section>
      )}

      {tab === "records" && (
        <section className="admin-section">
          <div className="admin-table">
            <div className="admin-row admin-head">
              <div>Name</div>
              <div>Phone</div>
              <div>Address</div>
              <div>Actions</div>
            </div>
            {records.map((record) => (
              <div className="admin-row" key={record._id}>
                <div>{record.name || "—"}</div>
                <div>{record.phone || "—"}</div>
                <div>{record.address || "—"}</div>
                <div className="admin-actions">
                  <button className="admin-secondary" onClick={() => startEdit(record)}>
                    Edit
                  </button>
                  <button className="admin-danger" onClick={() => deleteRecord(record._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {records.length === 0 && <p className="admin-empty">No records found.</p>}
          </div>

          {editId && (
            <div className="admin-edit">
              <h3>Edit Patient Record</h3>
              <div className="admin-form">
                <label>Name</label>
                <input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <label>Phone</label>
                <input
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
                <label>Address</label>
                <input
                  value={editForm.address || ""}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
                <label>Blood Group</label>
                <input
                  value={editForm.bloodGroup || ""}
                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                />
                <div className="admin-actions">
                  <button className="admin-primary" onClick={saveEdit} disabled={busy}>
                    Save
                  </button>
                  <button className="admin-secondary" onClick={() => setEditId("")} disabled={busy}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "audit" && (
        <section className="admin-section">
          <div className="admin-audit-toolbar">
            <input
              className="admin-search"
              type="text"
              placeholder="Search logs (action, user, phone...)"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
            />
            <button className="admin-secondary" onClick={exportAuditCsv}>
              Export CSV
            </button>
          </div>
          <div className="admin-table">
            <div className="admin-row admin-head">
              <div>Action</div>
              <div>Target</div>
              <div>Time</div>
              <div>Meta</div>
            </div>
            {filteredLogs.map((log) => (
              <div className="admin-row" key={log._id}>
                <div>{log.action}</div>
                <div>{log.targetType} {log.targetId}</div>
                <div>{new Date(log.createdAt).toLocaleString()}</div>
                <div className="admin-meta">{JSON.stringify(log.meta || {})}</div>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <p className="admin-empty">No audit logs yet.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;
