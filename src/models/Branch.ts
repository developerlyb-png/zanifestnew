import mongoose, { Schema } from "mongoose";

const BranchSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Branch || mongoose.model("Branch", BranchSchema);
