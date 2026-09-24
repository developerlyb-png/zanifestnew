import mongoose, { Schema } from "mongoose";

// A commission rule says "for this scope, pay this % commission" — resolved
// at policy-issuance time (most-specific scope wins). ALL_PRODUCTS is the
// global fallback; PRODUCT rules (e.g. scopeValue: "Motor") override it for
// that line of business. Agent-level overrides can be added later as a
// third scopeType without changing this shape.
export const COMMISSION_RULE_SCOPES = ["ALL_PRODUCTS", "PRODUCT"] as const;

const CommissionRuleSchema = new Schema(
  {
    scopeType: {
      type: String,
      enum: COMMISSION_RULE_SCOPES,
      required: true,
    },
    // Null/omitted for ALL_PRODUCTS; e.g. "Motor" for PRODUCT-scoped rules —
    // matches the same lineOfBusiness/policyType strings already used
    // elsewhere (see bucketFor() in PolicyDashboard.tsx).
    scopeValue: {
      type: String,
      default: null,
    },
    ratePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: String,
  },
  { timestamps: true }
);

// One active rule per scope — creating a new ALL_PRODUCTS or PRODUCT/"Motor"
// rule should replace the old rate, not silently create an ambiguous
// duplicate the resolver would have to pick between.
CommissionRuleSchema.index(
  { scopeType: 1, scopeValue: 1 },
  { unique: true }
);

export default mongoose.models.CommissionRule ||
  mongoose.model("CommissionRule", CommissionRuleSchema);
