import mongoose, { Schema } from "mongoose";

// Per-insurer column mapping for the Reconcile feature — every insurer
// names its commission-statement spreadsheet columns differently, so this
// is what lets one parser handle all of them: map our standard MIS fields
// to the exact column header text that insurer's file uses.
const InsuranceReconcileMappingSchema = new Schema(
  {
    insuranceCompanyConfig: {
      type: Schema.Types.ObjectId,
      ref: "InsuranceCompanyConfig",
      required: true,
      unique: true,
    },
    // Denormalized for display/search without a populate() on every list.
    insurerName: { type: String, required: true, trim: true },
    insurerBranch: { type: String, required: true, trim: true },

    // Every field below except policyNo is optional — an insurer's
    // statement only needs to map the columns it actually has.
    fieldMap: {
      policyNo: { type: String, required: true, trim: true },
      insuredName: { type: String, trim: true, default: "" },
      premium: { type: String, trim: true, default: "" }, // "policy_total_premium"
      commissionAmount: { type: String, trim: true, default: "" }, // "policy_total_commission_amount"
      commissionPercentage: { type: String, trim: true, default: "" }, // "policy_total_commission_percentage"
      basicPremiumAmount: { type: String, trim: true, default: "" },
      odPremiumAmount: { type: String, trim: true, default: "" },
      tpPremiumAmount: { type: String, trim: true, default: "" },
      terrorismPremiumAmount: { type: String, trim: true, default: "" },
    },

    createdBy: String,
  },
  { timestamps: true }
);

export default mongoose.models.InsuranceReconcileMapping ||
  mongoose.model("InsuranceReconcileMapping", InsuranceReconcileMappingSchema);
