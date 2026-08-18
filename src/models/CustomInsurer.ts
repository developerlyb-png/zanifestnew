import mongoose, { Schema } from "mongoose";

const CustomInsurerSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.CustomInsurer || mongoose.model("CustomInsurer", CustomInsurerSchema);
