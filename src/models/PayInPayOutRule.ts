import mongoose, { Schema } from "mongoose";

// A Pay In / Pay Out rule: "when a policy matches these criteria, the insurer
// pays us payInPercent and we pay the agent payOutPercent". A blank criterion
// means "any". Empty `rtos` / `manufacturers` mean all RTOs / all makes.
const PayInPayOutRuleSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    lineOfBusiness: { type: String, enum: ["Motor", "Non Motor"] },

    // Optional: when set, the rule applies only to these agents' policies.
    agentIds: { type: [Schema.Types.ObjectId], ref: "Agent", default: [] },
    agentNames: { type: [String], default: [] },

    insurer: String,
    businessSegment: String,
    product: String,
    policyType: String,
    transactionType: String,
    mediumOfInsurance: String,

    // Motor-only criteria
    rtos: { type: [String], default: [] },
    manufacturers: { type: [String], default: [] },
    fuel: String,
    ncb: String,
    volume: String,
    typeOfPolicy: String,
    capacity: String,
    discount: String,
    bodyType: String,
    gvw: String,
    vehicleAge: String,

    payInPercent: { type: Number, required: true, min: 0, max: 100 },
    payOutPercent: { type: Number, required: true, min: 0, max: 100 },

    active: { type: Boolean, default: true },
    createdBy: String,
  },
  { timestamps: true }
);

PayInPayOutRuleSchema.index({ lineOfBusiness: 1, startDate: -1 });

if (process.env.NODE_ENV !== "production") delete mongoose.models.PayInPayOutRule;

export default mongoose.models.PayInPayOutRule ||
  mongoose.model("PayInPayOutRule", PayInPayOutRuleSchema);
