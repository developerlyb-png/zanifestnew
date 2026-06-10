import mongoose, { Schema, models } from "mongoose";

const PolicySchema = new Schema(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },

    insuredName: String,
    policyNo: { type: String, required: true },
    companyName: String,
    amount: String,
    expiryDate: String,
    verified: { type: Boolean, default: false },
     pdfUrl: {
      type: String,
      default: null,
    },
    assignedAt: {
  type: Date,
  default: null,
},

  },
  { timestamps: true }
);

delete mongoose.models.Policy;
export default models.Policy || mongoose.model("Policy", PolicySchema);
