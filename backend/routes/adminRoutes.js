import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import AdminSession from "../models/AdminSession.js";
import AuditLog from "../models/AuditLog.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import PatientPassword from "../models/PatientPassword.js";
import DoctorPassword from "../models/DoctorPassword.js";

const router = express.Router();
const SESSION_HOURS = 8;

const createToken = () => crypto.randomBytes(32).toString("hex");

const logAction = async ({ actorType, actorId, action, targetType, targetId, meta }) => {
  try {
    await AuditLog.create({ actorType, actorId, action, targetType, targetId, meta });
  } catch (error) {
    console.error("Audit log error:", error?.message || error);
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
      return res.status(401).json({ success: false, message: "Missing admin token" });
    }

    const session = await AdminSession.findOne({ token });
    if (!session) {
      return res.status(401).json({ success: false, message: "Invalid admin session" });
    }

    if (session.expiresAt < new Date()) {
      await AdminSession.deleteOne({ _id: session._id });
      return res.status(401).json({ success: false, message: "Admin session expired" });
    }

    req.adminSession = session;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Admin auth error" });
  }
};

// Bootstrap: create first admin if none exists
router.post("/setup", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    const existing = await Admin.countDocuments();
    if (existing > 0) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    const admin = await Admin.create({ username, password });
    return res.status(201).json({ success: true, admin: { id: admin._id, username } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to setup admin" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken();
    const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
    await AdminSession.create({ token, adminId: admin._id, expiresAt });

    return res.json({
      success: true,
      token,
      admin: { id: admin._id, username: admin.username },
      expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Login failed" });
  }
});

router.post("/logout", requireAdmin, async (req, res) => {
  try {
    await AdminSession.deleteOne({ _id: req.adminSession._id });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
});

router.get("/users", requireAdmin, async (req, res) => {
  try {
    const role = req.query.role || "patient";
    if (role === "patient") {
      const patients = await Patient.find().sort({ createdAt: -1 });
      return res.json({ success: true, users: patients });
    }
    if (role === "doctor") {
      const doctors = await Doctor.find().sort({ createdAt: -1 });
      return res.json({ success: true, users: doctors });
    }
    return res.status(400).json({ success: false, message: "Invalid role" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load users" });
  }
});

router.patch("/users/:role/:id/active", requireAdmin, async (req, res) => {
  try {
    const { role, id } = req.params;
    const { active } = req.body || {};
    if (typeof active !== "boolean") {
      return res.status(400).json({ success: false, message: "Active must be boolean" });
    }

    const model = role === "patient" ? Patient : role === "doctor" ? Doctor : null;
    if (!model) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const updated = await model.findByIdAndUpdate(id, { isActive: active }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await logAction({
      actorType: "admin",
      actorId: String(req.adminSession.adminId),
      action: "toggle_active",
      targetType: role,
      targetId: id,
      meta: { active },
    });

    return res.json({ success: true, user: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update user status" });
  }
});

router.post("/users/:role/:id/reset-password", requireAdmin, async (req, res) => {
  try {
    const { role, id } = req.params;
    const model = role === "patient" ? Patient : role === "doctor" ? Doctor : null;
    const passwordModel = role === "patient" ? PatientPassword : role === "doctor" ? DoctorPassword : null;
    if (!model || !passwordModel) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await model.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const tempPassword = crypto.randomBytes(4).toString("hex");
    const hashed = await bcrypt.hash(tempPassword, 10);
    await passwordModel.findOneAndUpdate(
      { phone: user.phone },
      { password: hashed, phone: user.phone },
      { upsert: true }
    );

    await logAction({
      actorType: "admin",
      actorId: String(req.adminSession.adminId),
      action: "reset_password",
      targetType: role,
      targetId: id,
      meta: { phone: user.phone },
    });

    return res.json({ success: true, tempPassword });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to reset password" });
  }
});

router.get("/records/patients", requireAdmin, async (_req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    return res.json({ success: true, records: patients });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load records" });
  }
});

router.patch("/records/patients/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;
    delete updates.updatedAt;

    const updated = await Patient.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    await logAction({
      actorType: "admin",
      actorId: String(req.adminSession.adminId),
      action: "update_patient",
      targetType: "patient",
      targetId: id,
      meta: { fields: Object.keys(updates) },
    });

    return res.json({ success: true, record: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update record" });
  }
});

router.delete("/records/patients/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Patient.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    await logAction({
      actorType: "admin",
      actorId: String(req.adminSession.adminId),
      action: "delete_patient",
      targetType: "patient",
      targetId: id,
      meta: { phone: deleted.phone || null },
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete record" });
  }
});

router.get("/audit", requireAdmin, async (_req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load audit logs" });
  }
});

export default router;
