import mongoose, { Schema } from "mongoose";

export const LOB_SEGMENTS = ["Corporate", "Retail", "Rural"] as const;
export const LOB_IRDAI_GROUPS = [
  "General Insurance",
  "Health Insurance",
  "Life Insurance",
  "Reinsurance",
] as const;
export const LOB_IRDAI_TYPES = ["GI", "LI"] as const;

const LineOfBusinessSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    segment: { type: String, required: true, enum: LOB_SEGMENTS },
    irdaiGroup: { type: String, required: true, enum: LOB_IRDAI_GROUPS },
    irdaiType: { type: String, required: true, enum: LOB_IRDAI_TYPES },
    description: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.LineOfBusiness ||
  mongoose.model("LineOfBusiness", LineOfBusinessSchema);
