import mongoose, { Schema } from "mongoose";

// Configuration Management's Insurance Company tab — RM contact details per
// insurer/branch. Deliberately has no mapping fields (Employee Benefits /
// Reconcile) — that functionality is out of scope here.
const InsuranceCompanyConfigSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
    salesRmEmail: { type: String, trim: true },
    salesRmPhone: { type: String, trim: true },
    opsRmEmail: { type: String, required: true, trim: true },
    opsRmPhone: { type: String, required: true, trim: true },
    claimsRmEmail: { type: String, required: true, trim: true },
    claimsRmPhone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

InsuranceCompanyConfigSchema.index({ name: 1, branch: 1 }, { unique: true });

export default mongoose.models.InsuranceCompanyConfig ||
  mongoose.model("InsuranceCompanyConfig", InsuranceCompanyConfigSchema);
