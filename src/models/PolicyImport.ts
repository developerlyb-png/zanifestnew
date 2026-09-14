import mongoose, { Schema } from "mongoose";

// One row per uploaded PDF in an "Import from policy document" batch. Mirrors
// the reference insurance-crm-mvp's `imports` table: a PDF goes in, an async
// AI extraction fills `extracted`, an admin reviews/edits it, then approving
// creates a real IssuedPolicy from it.
export const POLICY_IMPORT_STATUSES = ["processing", "review", "failed", "saved"] as const;

const PolicyImportSchema = new Schema(
  {
    originalName: { type: String, required: true },
    fileData: { type: String, required: true }, // base64 PDF data URI

    status: {
      type: String,
      enum: POLICY_IMPORT_STATUSES,
      default: "processing",
    },

    error: String,

    // Raw AI-extracted fields (see aiPolicyExtractor.ts POLICY_EXTRACTION_SCHEMA),
    // kept mutable so review-queue edits can be saved back before approval.
    extracted: { type: Schema.Types.Mixed, default: null },

    confidence: Number,

    createdBy: String,

    savedPolicyId: {
      type: Schema.Types.ObjectId,
      ref: "IssuedPolicy",
    },
  },
  { timestamps: true }
);

// Every row embeds its source PDF as base64 (up to 15MB) in `fileData`. The
// list query excludes that field from its *output*, but without an index on
// createdAt, satisfying `.sort({ createdAt: -1 }).limit(100)` still requires
// scanning every document off disk (fileData included) before sorting — this
// index lets Mongo walk the sort order directly instead.
PolicyImportSchema.index({ createdAt: -1 });

export default mongoose.models.PolicyImport || mongoose.model("PolicyImport", PolicyImportSchema);
