import mongoose, { Schema } from "mongoose";

// A Pay In / Pay Out rule: "when a policy matches these criteria, the insurer
// pays us payInPercent and we pay the agent payOutPercent". A blank criterion
// means "any". Motor-only criteria are only ever set when lineOfBusiness is
// "Motor" — the single Create Rule form shows them conditionally.
const PayInPayOutRuleSchema = new Schema(
  {
    startDate: { type: Date, required: true },

    insurer: String,
    businessSegment: String,
    lineOfBusiness: String,
    product: String,
    policyType: String,
    transactionType: String,
    mediumOfInsurance: String,

    // Motor-only criteria
    fuel: String,
    rto: String,
    manufacture: String,
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
