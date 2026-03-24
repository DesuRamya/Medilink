import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actorType: {
      type: String,
      required: true,
      trim: true,
    },
    actorId: {
      type: String,
      default: null,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
