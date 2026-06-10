import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    districtManager: {
      type: String,
      ref: "Manager",
      required: true,
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
    saleStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Sale || mongoose.model("Sale", saleSchema);
