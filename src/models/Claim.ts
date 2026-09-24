import mongoose, { Schema } from "mongoose";
import { CLAIM_TYPES, CLAIM_STATUSES, REPORTED_CHANNELS, DEFAULT_CLAIM_STATUS } from "@/constants/claims";

const ClaimSchema = new Schema(
  {
    claimNumber: { type: String, required: true, unique: true, trim: true },
    claimType: { type: String, enum: CLAIM_TYPES, required: true },
    status: { type: String, enum: CLAIM_STATUSES, default: DEFAULT_CLAIM_STATUS },

    // Snapshot of the policy at claim time — copied (not just referenced) so
    // the claim keeps showing what was true when it was filed even if the
    // policy record is later edited.
    policyId: { type: Schema.Types.ObjectId, ref: "IssuedPolicy" },
    policyNumber: { type: String, required: true, trim: true },
    insuredName: String,
    contactMobile: String,
    contactEmail: String,
    insurer: String,
    lineOfBusiness: String,
    productCode: String,

    reportedChannel: { type: String, enum: REPORTED_CHANNELS, required: true },
    dateOfLoss: Date,
    reportedOn: { type: Date, default: Date.now },
    specialRemark: { type: String, required: true },
    claimDetails: String,

    estimatedAmount: { type: Number, default: 0 },
    claimedAmount: { type: Number, default: 0 },
    approvedAmount: { type: Number, default: 0 },

    // Step 2 — Non Employee Benefit (property / marine style loss)
    lossCause: String,
    lossDetails: String,
    siteAddress: String,
    sitePinCode: String,
    state: String,
    city: String,

    // Step 2 — Employee Benefit (hospitalization style claim)
    patientName: String,
    hospitalName: String,
    diagnosis: String,
    admissionDate: Date,
    dischargeDate: Date,

    // "Notify via WhatsApp & Email on submit and on every status change"
    notify: { type: Boolean, default: true },

    createdBy: String,

    // Status history shown as the "Claim Timeline" on the detail page.
    timeline: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: String,
        note: String,
      },
    ],

    // Uploaded claim documents, stored as base64 data URIs — same
    // convention as PAN/Aadhaar/policy PDFs elsewhere in this app.
    documents: [
      {
        name: String,
        mimeType: String,
        size: Number,
        data: String,
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: String,
      },
    ],
  },
  { timestamps: true }
);

ClaimSchema.index({ reportedOn: -1 });
ClaimSchema.index({ policyNumber: 1 });

// In dev, hot reload keeps the previously compiled model, so newly added
// schema fields (documents, timeline, ...) would be silently dropped.
if (process.env.NODE_ENV !== "production") delete mongoose.models.Claim;

export default mongoose.models.Claim || mongoose.model("Claim", ClaimSchema);
