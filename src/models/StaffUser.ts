import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Standalone staff-account system for the User Management tab — separate
// from Admin/Manager/Agent (each of those keeps its own model and login
// flow untouched). A StaffUser logs in through the same /adminlogin screen
// (src/pages/api/admin/login.ts checks this collection too), but what they
// can see is driven entirely by accessModules/adminAccessModules below,
// not a fixed role check like Admin's.
const BankDetailsSchema = new Schema(
  {
    accountHolderName: String,
    bankName: String,
    ifscCode: String,
    accountNumber: String,
    cancelledCheque: { data: String, fileName: String },
  },
  { _id: false }
);

const StaffUserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    branch: { type: String, trim: true },

    // Only meaningful when role is a POSP-style role — left blank otherwise.
    pospType: { type: String, trim: true },
    pospCode: { type: String, trim: true }, // system-generated, e.g. POS26-000010
    irdaiPospCode: { type: String, trim: true },
    payoutPercentage: { type: Number },
    bankDetails: BankDetailsSchema,

    accessModules: { type: [String], default: [] },
    adminAccessModules: { type: [String], default: [] },

    // Only set for roles "Admin" / "Branch Manager" — those roles are real
    // Admin/Manager accounts under the hood (so they show up and work in
    // the existing Admin List / Manager List, bulk-upload reporting-manager
    // picker, etc.), with this StaffUser row kept as a denormalized copy for
    // the User Management table. Login for these two roles goes through the
    // linked Admin/Manager account, not this one.
    linkedAccountType: { type: String, enum: ["Admin", "Manager"] },
    linkedAccountId: { type: Schema.Types.ObjectId },

    // Only required/used when role is "Branch Manager" — Manager's schema
    // needs these for the mirrored record.
    pinCode: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: String,
  },
  { timestamps: true }
);

StaffUserSchema.pre("save", async function (next) {
  const user = this as any;
  if (!user.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

StaffUserSchema.index({ createdAt: -1 });

export default mongoose.models.StaffUser || mongoose.model("StaffUser", StaffUserSchema);
