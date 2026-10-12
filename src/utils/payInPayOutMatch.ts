// Matches an issued policy against saved Pay In / Pay Out rules and computes
// the commission amounts. Used by both the admin Commission tab (every
// policy) and the agent My Commission tab (that agent's policies only), so
// the two always agree on the same number for the same policy.
//
// Nothing is stored on IssuedPolicy — amounts are recomputed on every read,
// so editing a rule (or a policy's premium) corrects every report at once.
//
// Matching rules:
//  - lineOfBusiness must equal the policy's (Motor / Non Motor).
//  - agentIds, when non-empty, must contain the policy's agent.
//  - rtos, when non-empty, must contain the policy's RTO (derived from the
//    registration number, e.g. UP14FY9367 -> UP-14).
//  - manufacturers, when non-empty, must contain the policy's vehicle make.
//  - Every other field set on the rule must equal the policy's value.
//  - Blank = any.

export interface RuleLike {
  _id: any;
  startDate: string | Date;
  active?: boolean;
  lineOfBusiness?: string;
  agentIds?: any[];
  agentNames?: string[];
  insurer?: string;
  businessSegment?: string;
  product?: string;
  policyType?: string;
  transactionType?: string;
  mediumOfInsurance?: string;
  rtos?: string[];
  manufacturers?: string[];
  fuel?: string;
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
  createdByAgentId?: any;
  assignment?: { pospAgent?: { id?: any } };
  vehicle?: { number?: string; make?: string; fuelType?: string; ncbApplicable?: string };
}

const norm = (v?: string | null) => String(v || "").trim().toLowerCase();

// Single-value criteria -> how to read the same value off a policy.
const FIELD_READERS: Record<string, (p: PolicyLike) => string | undefined> = {
  insurer: (p) => p.insurer,
  businessSegment: (p) => p.businessSegment,
  product: (p) => p.product,
  policyType: (p) => p.policyTypeStructure,
  transactionType: (p) => p.transactionType,
  mediumOfInsurance: (p) => p.mediumOfIssuance,
  fuel: (p) => p.vehicle?.fuelType,
  ncb: (p) => p.vehicle?.ncbApplicable,
};

// "UP14FY9367" -> "UP-14"; matches the RTO codes in the RTO master.
export function rtoOf(p: PolicyLike): string {
  const m = String(p.vehicle?.number || "").toUpperCase().match(/^([A-Z]{2})(\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}` : "";
}

export function policyAgentId(p: PolicyLike): string {
  return String(p.createdByAgentId || p.assignment?.pospAgent?.id || "");
}

export function policyDate(p: PolicyLike): Date {
  const d = p.startDate || p.paymentReceivedDate || p.createdAt;
  const parsed = d ? new Date(d) : new Date();
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function matches(rule: RuleLike, p: PolicyLike): boolean {
  if (rule.lineOfBusiness && norm(rule.lineOfBusiness) !== norm(p.lineOfBusiness)) return false;
  if (rule.agentIds?.length && !rule.agentIds.map((id) => String(id)).includes(policyAgentId(p))) return false;
  if (rule.rtos?.length && !rule.rtos.map(norm).includes(norm(rtoOf(p)))) return false;
  if (rule.manufacturers?.length && !rule.manufacturers.map(norm).includes(norm(p.vehicle?.make))) {
    return false;
  }
  for (const [field, read] of Object.entries(FIELD_READERS)) {
    const ruleVal = (rule as any)[field];
    if (!ruleVal) continue;
    if (norm(ruleVal) !== norm(read(p))) return false;
  }
  return true;
}

// How many criteria the rule actually sets — more specific rules win.
function specificity(rule: RuleLike): number {
  let score = 0;
  if (rule.lineOfBusiness) score++;
  if (rule.agentIds?.length) score++;
  if (rule.rtos?.length) score++;
  if (rule.manufacturers?.length) score++;
  for (const field of Object.keys(FIELD_READERS)) if ((rule as any)[field]) score++;
  return score;
}

// Returns the best-matching rule for a policy, or null if none match.
// Ties go to the rule with the later Start Date, then the newer rule.
// Start Date is never a cutoff — every matching policy gets the rule.
export function matchRule(policy: PolicyLike, rules: RuleLike[]): RuleLike | null {
  let best: RuleLike | null = null;
  let bestScore = -1;

  for (const rule of rules) {
    if (rule.active === false) continue;
    if (!matches(rule, policy)) continue;

    const score = specificity(rule);
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
// GST) — the same base the existing manual commissionPercent-per-row flow uses.
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
  const parts: string[] = [];
  if (rule.lineOfBusiness) parts.push(rule.lineOfBusiness);
  if (rule.agentNames?.length) parts.push(`Agent: ${rule.agentNames.join(", ")}`);
  if (rule.rtos?.length) parts.push(`RTO: ${rule.rtos.join(", ")}`);
  if (rule.manufacturers?.length) parts.push(rule.manufacturers.join(", "));
  for (const field of Object.keys(FIELD_READERS)) {
    const v = (rule as any)[field];
    if (v) parts.push(String(v));
  }
  return parts.length ? parts.join(" · ") : "All policies";
}
