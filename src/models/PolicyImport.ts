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

export default mongoose.models.PolicyImport || mongoose.model("PolicyImport", PolicyImportSchema);
