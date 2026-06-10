import mongoose from "mongoose";

const ServiceItemSchema = new mongoose.Schema({
  type: { type: String, required: true },
  name: { type: String, required: true },
  desc: { type: String, required: true },
});

const BestServiceSchema = new mongoose.Schema({
  heading: { type: String, required: true, default: "Best Service" },
  services: {
    type: [ServiceItemSchema],
    default: [],
  },
});

export default mongoose.models.BestService ||
  mongoose.model("BestService", BestServiceSchema);
