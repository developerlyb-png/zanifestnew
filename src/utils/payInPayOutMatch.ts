// Matches an issued policy against saved Pay In / Pay Out rules and computes
// the commission amounts. Used by both the admin Commission tab (every
// policy) and the agent My Commission tab (that agent's policies only), so
// the two always agree on the same number for the same policy.
//
// Deliberately NOT written onto IssuedPolicy at creation time — it's
// recomputed on every read instead, so editing a rule (or a policy's
// premium) immediately corrects every report that reads it, with nothing to
// migrate or fall out of sync.
//
// Known limitation: rule fields RTO, Volume, Type of Policy, Capacity,
// Discount, Body Type, GVW and Vehicle Age have no matching data stored on
// IssuedPolicy today, so they are not enforced when matching — a rule using
// them still matches on its other criteria. Only Insurer, Business Segment,
// Line of Business, Product, Policy Type, Transaction Type, Medium of
// Insurance, Fuel, Manufacture and NCB are checked against real policy data.

export interface RuleLike {
  _id: any;
  startDate: string | Date;
  active?: boolean;
  insurer?: string;
  businessSegment?: string;
  lineOfBusiness?: string;
  product?: string;
  policyType?: string;
  transactionType?: string;
  mediumOfInsurance?: string;
  fuel?: string;
  manufacture?: string;
  ncb?: string;
  payInPercent: number;
  payOutPercent: number;
  createdBy?: string;
  createdAt?: string | Date;
}

export interface PolicyLike {
  insurer?: string;
  businessSegment?: string;
  lineOfBusiness?: string;
  product?: string;
  policyTypeStructure?: string;
  transactionType?: string;
  mediumOfIssuance?: string;
  premium?: number;
  startDate?: string | Date;
  paymentReceivedDate?: string | Date;
  createdAt?: string | Date;
  vehicle?: { fuelType?: string; make?: string; ncbApplicable?: string };
}

// Rule field -> how to read the comparable value off a policy.
const FIELD_READERS: Record<string, (p: PolicyLike) => string | undefined> = {
  insurer: (p) => p.insurer,
  businessSegment: (p) => p.businessSegment,
  lineOfBusiness: (p) => p.lineOfBusiness,
  product: (p) => p.product,
  policyType: (p) => p.policyTypeStructure,
  transactionType: (p) => p.transactionType,
  mediumOfInsurance: (p) => p.mediumOfIssuance,
  fuel: (p) => p.vehicle?.fuelType,
  manufacture: (p) => p.vehicle?.make,
  ncb: (p) => p.vehicle?.ncbApplicable,
};

const norm = (v?: string) => (v || "").trim().toLowerCase();

export function policyDate(p: PolicyLike): Date {
  const d = p.startDate || p.paymentReceivedDate || p.createdAt;
  const parsed = d ? new Date(d) : new Date();
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Returns the best-matching rule for a policy, or null if none match.
// "Best" = most of the rule's own criteria fields are specified (more
// specific rules win over broader ones); ties go to the rule with the
// later Start Date, then the more recently created one.
//
// Start Date is NOT a hard cutoff — a rule applies to every matching policy
// regardless of when that policy was issued, not just ones from its Start
// Date onward. It only acts as a tiebreaker between two otherwise-equal
// matches (the newer rule wins), so creating one rule always applies it to
// your existing policies immediately instead of silently excluding them.
export function matchRule(policy: PolicyLike, rules: RuleLike[]): RuleLike | null {
  let best: RuleLike | null = null;
  let bestScore = -1;

  for (const rule of rules) {
    if (rule.active === false) continue;

    let score = 0;
    let ok = true;
    for (const [field, read] of Object.entries(FIELD_READERS)) {
      const ruleVal = (rule as any)[field];
      if (!ruleVal) continue; // blank = "All" = wildcard, doesn't count against match
      score++;
      if (norm(ruleVal) !== norm(read(policy))) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    const better =
      score > bestScore ||
      (score === bestScore &&
        best &&
        (new Date(rule.startDate) > new Date(best.startDate) ||
          (new Date(rule.startDate).getTime() === new Date(best.startDate).getTime() &&
            new Date(rule.createdAt || 0) > new Date(best.createdAt || 0))));

    if (better) {
      best = rule;
      bestScore = score;
    }
  }

  return best;
}

export interface CommissionResult {
  rule: RuleLike | null;
  baseAmount: number;
  payInAmount: number;
  payOutAmount: number;
}

// Commission is computed on net Premium Amount (not Gross, which includes
// GST) — the same base the existing manual commissionPercent-per-row flow
// (AddPolicyForm/AgentPolicyDashboard) already uses.
export function computeCommission(policy: PolicyLike, rules: RuleLike[]): CommissionResult {
  const rule = matchRule(policy, rules);
  const baseAmount = policy.premium || 0;
  if (!rule) return { rule: null, baseAmount, payInAmount: 0, payOutAmount: 0 };
  return {
    rule,
    baseAmount,
    payInAmount: Math.round(((baseAmount * rule.payInPercent) / 100) * 100) / 100,
    payOutAmount: Math.round(((baseAmount * rule.payOutPercent) / 100) * 100) / 100,
  };
}

export function ruleSummary(rule: RuleLike | null): string {
  if (!rule) return "No matching rule";
  const parts = Object.keys(FIELD_READERS)
    .map((f) => (rule as any)[f])
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : "All Products";
}
