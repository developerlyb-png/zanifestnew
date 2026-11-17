import mongoose, { Schema } from "mongoose";

// Dynamic role list for User Management. Only "Admin" and "Branch Manager"
// exist out of the box (isSystem) — they're special because staff-users.ts
// creates a real Admin/Manager account behind them, so they can't be renamed
// or deleted. Every other role is added by an admin from the "Manage Roles"
// screen and is just a label + an optional POSP-details section on the form.
export const SYSTEM_ROLES = ["Admin", "Branch Manager"] as const;

const StaffRoleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // lowercase copy so "Telecaller" and "telecaller" can't both exist
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: "" },
    // When true the Add/Edit User form shows the POSP Details + Bank Details
    // section (POSP type, IRDAI code, payout %, cheque) for this role.
    hasPospFields: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: String,
  },
  { timestamps: true }
);

export default mongoose.models.StaffRole || mongoose.model("StaffRole", StaffRoleSchema);
