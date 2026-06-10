import mongoose, { Schema, models, model } from "mongoose";

const LeadSchema = new Schema(
  {
    email: { type: String },
    phone: { type: String },
    module: { type: String },
    assignedAt: { type: Date },

    status: {
      type: String,
      enum: ["Cold", "Hot", "Closed", "interested", "not interested"],
      default: "Cold",
    },

    remark: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default models.Lead || model("Lead", LeadSchema);
