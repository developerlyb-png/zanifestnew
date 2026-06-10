// models/insurance.ts
import mongoose, { Schema, models, model } from "mongoose";

const InsuranceSchema = new Schema({
  heading: { type: String, default: "Click to buy an Insurance" },
  order: { type: [String], default: [] },
});

// Prevent recompiling model on hot reload
const InsuranceModel =
  models.Insurance || model("Insurance", InsuranceSchema);

export default InsuranceModel;
