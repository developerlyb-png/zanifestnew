import mongoose, { Schema } from "mongoose";

const BranchSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    // Added for Configuration Management's Branch tab. Branches created
    // earlier via the simple add-branch flow (AddPolicyForm) have no code —
    // sparse keeps that legacy gap from colliding on the unique index.
    code: { type: String, trim: true, uppercase: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BranchSchema.index({ code: 1 }, { unique: true, sparse: true });

export default mongoose.models.Branch || mongoose.model("Branch", BranchSchema);
