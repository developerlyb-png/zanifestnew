import mongoose, { Schema } from "mongoose";

export const RECONCILE_CATEGORIES = ["matched", "mismatched", "missing_in_mis", "missing_in_cs"] as const;

// One row per compared policy. Expected = our own system (MIS); Actual =
// the insurer's uploaded commission statement (CS).
const ReconcileResultRowSchema = new Schema(
  {
    policyNo: { type: String, required: true, trim: true },
    insuredName: String,
    category: { type: String, enum: RECONCILE_CATEGORIES, required: true },

    expectedPremium: Number,
    actualPremium: Number,
    expectedCommissionAmount: Number,
    actualCommissionAmount: Number,
    expectedCommissionPercentage: Number,
    actualCommissionPercentage: Number,

    // Premium breakdown — optional on both sides. Expected (MIS) is only
    // ever populated for Basic/OD/TP (sourced from IssuedPolicy's own
    // premiumBreakdown rows); there's no "Terrorism" breakdown row in our
    // policy data at all, so that one is always actual-only. None of these
    // four factor into the matched/mismatched classification above — we
    // don't have a reliable enough expected-value source for them yet.
    expectedBasicPremium: Number,
    actualBasicPremium: Number,
    expectedOdPremium: Number,
    actualOdPremium: Number,
    expectedTpPremium: Number,
    actualTpPremium: Number,
    actualTerrorismPremium: Number,
  },
  { _id: false }
);

// One document per "New Reconciliation" run — the unit shown as a row in
// the dashboard's Reconciliation History table (Batch ID 1, 2, 3...).
// Only created for real runs; a "Preview only (dry run)" never reaches here.
const ReconciliationBatchSchema = new Schema(
  {
    batchNo: { type: Number, required: true, unique: true },

    insuranceCompanyConfig: { type: Schema.Types.ObjectId, ref: "InsuranceCompanyConfig", required: true },
    insurerName: { type: String, required: true, trim: true },
    insurerBranch: String,

    fileName: { type: String, required: true },
    fileData: { type: String, required: true }, // base64 data URI, same convention as other uploads in this app

    reconciledBy: String,

    policiesInDb: { type: Number, default: 0 },
    recordsInExcel: { type: Number, default: 0 },

    matchedCount: { type: Number, default: 0 },
    mismatchedCount: { type: Number, default: 0 },
    missingInMisCount: { type: Number, default: 0 },
    missingInCsCount: { type: Number, default: 0 },

    // Which of the optional breakdown fields (basicPremium/odPremium/
    // tpPremium/terrorismPremium) this insurer's mapping had configured at
    // run time — lets the detail view only show columns that have data.
    mappedFields: [String],

    results: [ReconcileResultRowSchema],
  },
  { timestamps: true }
);

ReconciliationBatchSchema.index({ createdAt: -1 });

export default mongoose.models.ReconciliationBatch ||
  mongoose.model("ReconciliationBatch", ReconciliationBatchSchema);
