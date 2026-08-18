import mongoose, { Schema } from "mongoose";

const MotorMakeSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.MotorMake || mongoose.model("MotorMake", MotorMakeSchema);
