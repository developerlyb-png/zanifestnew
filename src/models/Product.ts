import mongoose, { Schema } from "mongoose";

export const PRODUCT_DOCUMENT_CATEGORIES = [
  "Proof of Policy & Identity",
  "Incident/Asset/Treatment Documentation",
  "Verification of Policyholder/Asset",
  "Other Supporting Documents (Bills, FIRs, Receipts etc)",
] as const;

export const PRODUCT_DOCUMENT_OPTIONS = [
  "GST",
  "Driving License",
  "Passport",
  "Aadhar Back Side",
  "Aadhar Front Side",
  "Aadhar Card",
  "PAN",
] as const;

const RequiredDocumentGroupSchema = new Schema(
  {
    category: { type: String, required: true, enum: PRODUCT_DOCUMENT_CATEGORIES },
    documents: [{ type: String, enum: PRODUCT_DOCUMENT_OPTIONS }],
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    lineOfBusiness: { type: Schema.Types.ObjectId, ref: "LineOfBusiness", required: true },
    description: { type: String, trim: true, default: "" },
    requiredDocuments: { type: [RequiredDocumentGroupSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
