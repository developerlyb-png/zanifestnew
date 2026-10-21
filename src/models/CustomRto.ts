import mongoose, { Schema } from "mongoose";

// RTO codes an admin added by hand from the Pay In Pay Out rule form,
// because the code wasn't in the static RTO master list (src/lib/sbiMasterData).
const CustomRtoSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  },
  { timestamps: true }
);

export default mongoose.models.CustomRto || mongoose.model("CustomRto", CustomRtoSchema);
