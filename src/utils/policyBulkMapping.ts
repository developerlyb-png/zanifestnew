// Shared row-mapping logic for the Policies bulk-upload flow, used by both
// /api/admin/policies-bulk and /api/agent/policies-bulk so the two stay in
// sync (same accepted columns, same coercion rules, same validation).

import Branch from "@/models/Branch";
import MotorMake from "@/models/MotorMake";
import CustomInsurer from "@/models/CustomInsurer";
import {
  TRANSACTION_TYPES,
  LINES_OF_BUSINESS,
  PRODUCTS_BY_LOB,
  VEHICLE_TYPES,
  FUEL_TYPES,
  NCB_OPTIONS,
  CASE_TYPES,
  POLICY_TYPES_BY_LOB,
  POLICY_REMARKS,
  MEDIUM_OF_ISSUANCE,
  REWARD_STATUS,
  BRANCH_NAMES,
  MOTOR_MAKES,
  INSURANCE_COMPANIES,
} from "@/constants/policyFormOptions";

export const REQUIRED_KEYS = ["policyNumber", "insurer", "lineOfBusiness", "premium"];

export const num = (v: any): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

export const str = (v: any): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
};

export const date = (v: any): Date | undefined => {
  const s = str(v);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

export const rowIsBlank = (row: Record<string, any>) =>
  Object.values(row).every((v) => v === undefined || v === null || String(v).trim() === "");

// ================= VALIDATION =================

export interface ReferenceLists {
  branches: string[];
  motorMakes: string[];
  insurers: string[];
}

export async function loadReferenceLists(): Promise<ReferenceLists> {
  const [branches, motorMakes, insurers] = await Promise.all([
    Branch.find({}, { name: 1 }),
    MotorMake.find({}, { name: 1 }),
    CustomInsurer.find({}, { name: 1 }),
  ]);
  return {
    branches: [...BRANCH_NAMES, ...branches.map((b: any) => b.name)],
    motorMakes: [...MOTOR_MAKES, ...motorMakes.map((m: any) => m.name)],
    insurers: [...INSURANCE_COMPANIES, ...insurers.map((i: any) => i.name)],
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateStr(v: string): boolean {
  if (!DATE_RE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  // Rejects JS Date's silent rollover for out-of-range values (e.g. 2026-02-30).
  return (
    parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d
  );
}

function isValidNumber(v: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(v.trim());
}

function matchOption(value: string, options: string[]): string | null {
  const found = options.find((o) => o.toLowerCase() === value.trim().toLowerCase());
  return found ?? null;
}

// ---- Fuzzy insurer-name matching ----
// The same insurer shows up under wildly different spellings depending on
// where the name came from — manual entry, Excel bulk upload, or AI PDF
// extraction, which copies whatever the source document prints (and can
// introduce OCR slips): "TATA AIG" vs "Tata AIG General Insurance Company
// Limited", "ICICI Lombard General Insurance Co. Ltd." vs a misread "icici
// lambaord". An exact (even case-folded) match misses all of these and lets
// every spelling become its own distinct "insurer" — this instead strips
// the generic legal boilerplate and then does a typo-tolerant, per-word
// comparison, so only the real distinguishing brand words have to line up.
const INSURER_STOPWORDS = ["THE", "GENERAL", "INSURANCE", "COMPANY", "CO", "LTD", "LIMITED", "AND"];
const INSURER_STOPWORD_SET = new Set(INSURER_STOPWORDS);
// "GENERAL" is excluded from fuzzy (typo-tolerant) stopword matching on
// purpose: "Generali" (a real insurer brand) is one edit away from it, so
// fuzzy-stripping would eat a real brand word. A literal typo of "General"
// just falls through as an extra, harmless token instead (see matchScore).
const FUZZY_INSURER_STOPWORDS = INSURER_STOPWORDS.filter((w) => w !== "GENERAL");

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

const WORD_SIM_THRESHOLD = 0.65; // per-word typo tolerance
const CANDIDATE_MATCH_THRESHOLD = 0.65; // fraction of a candidate's brand words that must be found

function isNearStopword(word: string): boolean {
  if (INSURER_STOPWORD_SET.has(word)) return true;
  if (word.length < 5) return false; // too short to safely fuzzy-match a stopword
  return FUZZY_INSURER_STOPWORDS.some((sw) => sw.length >= 5 && levenshtein(word, sw) <= 1);
}

function insurerTokens(name: string): string[] {
  return name
    .toUpperCase()
    .replace(/\([^)]*\)/g, " ") // drop parenthetical qualifiers, e.g. "(India)"
    .replace(/[^A-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);
}

function insurerSignificantTokens(name: string): string[] {
  return insurerTokens(name).filter((w) => !isNearStopword(w));
}

function tokenSimilarity(a: string, b: string): number {
  if (a.length <= 3 || b.length <= 3) return a === b ? 1 : 0;
  // A genuine typo/OCR slip of a word almost always keeps its first letter
  // intact; two coincidentally similar but unrelated words (e.g. "GENRAL"
  // vs "CENTRAL") often don't — this blocks that class of false match
  // without needing a stricter (and typo-intolerant) overall threshold.
  if (a[0] !== b[0]) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function candidateMatchScore(rawTokens: string[], candidateTokens: string[]): number {
  if (candidateTokens.length === 0) return 0;
  let matched = 0;
  for (const ct of candidateTokens) {
    const best = rawTokens.reduce((m, rt) => Math.max(m, tokenSimilarity(ct, rt)), 0);
    if (best >= WORD_SIM_THRESHOLD) matched++;
  }
  return matched / candidateTokens.length;
}

export function matchInsurerName(raw: string, options: string[]): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const exact = matchOption(trimmed, options);
  if (exact) return exact;

  const rawTokens = insurerSignificantTokens(trimmed);
  if (rawTokens.length === 0) return null;

  let best: string | null = null;
  let bestScore = 0;
  for (const opt of options) {
    const score = candidateMatchScore(rawTokens, insurerSignificantTokens(opt));
    if (score > bestScore) {
      bestScore = score;
      best = opt;
    }
  }
  return bestScore >= CANDIDATE_MATCH_THRESHOLD ? best : null;
}

// Called whenever matchInsurerName() finds nothing close enough — the raw
// text is treated as a genuinely new insurer and added to the registry (so
// it becomes part of refs.insurers, and future spellings of this same new
// company can fuzzy-match onto it too) instead of being rejected.
export async function registerNewInsurer(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await CustomInsurer.findOne({ name: { $regex: `^${escaped}$`, $options: "i" } });
    if (!existing) {
      await CustomInsurer.create({ name: trimmed });
    }
  } catch {
    // Non-fatal — the policy still saves with this insurer text even if the
    // registry write loses a race against a concurrent identical insert.
  }
}

const DATE_FIELDS: { key: string; label: string }[] = [
  { key: "paymentReceivedDate", label: "Payment Received Date" },
  { key: "startDate", label: "Risk Start Date" },
  { key: "endDate", label: "Risk End Date" },
];

const NUMBER_FIELDS: { key: string; label: string }[] = [
  { key: "premium", label: "Premium Amount" },
  { key: "taxRate", label: "Tax Rate" },
  { key: "gstAmount", label: "GST Amount" },
  { key: "grossPremium", label: "Gross Premium" },
  { key: "commissionAmount", label: "Commission Amount" },
  { key: "payoutAmount", label: "Payout Amount" },
];

/**
 * Validates every recognised column on a row against the same option lists
 * the single-entry Add Policy form uses (plus admin/agent-added branches,
 * motor makes and insurers). Returns the list of human-readable field errors
 * (empty when the row is clean) and a normalized copy of the row where any
 * matched dropdown value has been rewritten to its canonical casing, so a
 * row like `lineOfBusiness: "motor"` is stored as "Motor" rather than
 * silently breaking the exact-string checks mapRow relies on.
 */
export function validateAndNormalizeRow(
  row: Record<string, any>,
  refs: ReferenceLists
): { errors: string[]; row: Record<string, any>; newInsurer?: string } {
  const errors: string[] = [];
  const normalized: Record<string, any> = { ...row };

  const checkEnum = (key: string, label: string, options: string[]): string | null => {
    const raw = str(row[key]);
    if (!raw) return null;
    const match = matchOption(raw, options);
    if (!match) {
      errors.push(`${label} "${raw}" is invalid (must be one of: ${options.join(", ")})`);
      return null;
    }
    normalized[key] = match;
    return match;
  };

  const lob = checkEnum("lineOfBusiness", "Line of Business", LINES_OF_BUSINESS);

  const productRaw = str(row.product);
  if (productRaw && lob) {
    const validProducts = PRODUCTS_BY_LOB[lob] || [];
    const match = matchOption(productRaw, validProducts);
    if (!match) {
      errors.push(
        `Product "${productRaw}" is invalid for Line of Business "${lob}" (must be one of: ${validProducts.join(", ")})`
      );
    } else {
      normalized.product = match;
    }
  }

  const policyTypeRaw = str(row.policyTypeStructure);
  if (policyTypeRaw && lob) {
    const validTypes = POLICY_TYPES_BY_LOB[lob] || [];
    const match = matchOption(policyTypeRaw, validTypes);
    if (!match) {
      errors.push(
        `Policy Type "${policyTypeRaw}" is invalid for Line of Business "${lob}" (must be one of: ${validTypes.join(", ")})`
      );
    } else {
      normalized.policyTypeStructure = match;
    }
  }

  checkEnum("transactionType", "Business Type", TRANSACTION_TYPES);
  checkEnum("policyRemark", "Policy Remark", POLICY_REMARKS);
  checkEnum("mediumOfIssuance", "Medium of Issuance", MEDIUM_OF_ISSUANCE);
  checkEnum("rewardStatus", "Reward Status", REWARD_STATUS);

  let newInsurer: string | undefined;
  const insurerRaw = str(row.insurer);
  if (insurerRaw) {
    const insurerMatch = matchInsurerName(insurerRaw, refs.insurers);
    if (insurerMatch) {
      normalized.insurer = insurerMatch;
    } else {
      // No existing insurer (predefined or previously custom-added) is even
      // a fuzzy match — treat this as a genuinely new insurer rather than
      // rejecting the row. The caller registers it (registerNewInsurer) so
      // it becomes part of the reference list for future rows/uploads.
      normalized.insurer = insurerRaw;
      newInsurer = insurerRaw;
    }
  }

  checkEnum("branchName", "Branch Name", refs.branches);

  const agentTypeRaw = str(row.agentType);
  if (agentTypeRaw && !["posp", "direct"].includes(agentTypeRaw.toLowerCase())) {
    errors.push(`Agent Type "${agentTypeRaw}" is invalid (must be one of: Direct, POSP)`);
  }

  if (lob === "Motor") {
    checkEnum("vehicleType", "Vehicle Type", VEHICLE_TYPES);
    checkEnum("fuelType", "Fuel Type", FUEL_TYPES);
    checkEnum("ncbApplicable", "NCB Applicable", NCB_OPTIONS);
    checkEnum("caseType", "Case Type", CASE_TYPES);
    checkEnum("motorMake", "Motor Make", refs.motorMakes);

    const modelYearRaw = str(row.modelYear);
    if (modelYearRaw) {
      const year = Number(modelYearRaw);
      const currentYear = new Date().getFullYear();
      if (!/^\d{4}$/.test(modelYearRaw) || year < 1980 || year > currentYear + 1) {
        errors.push(`Model Year "${modelYearRaw}" is invalid (must be a 4-digit year)`);
      }
    }
  }

  for (const { key, label } of DATE_FIELDS) {
    const raw = str(row[key]);
    if (raw && !isValidDateStr(raw)) {
      errors.push(`${label} "${raw}" is invalid (must be in YYYY-MM-DD format)`);
    }
  }

  for (const { key, label } of NUMBER_FIELDS) {
    const raw = str(row[key]);
    if (raw && !isValidNumber(raw)) {
      errors.push(`${label} "${raw}" must be a number`);
    }
  }

  const emailRaw = str(row.insuredEmail);
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    errors.push(`Insured Email Address "${emailRaw}" is not a valid email address`);
  }

  const mobileRaw = str(row.insuredMobile);
  if (mobileRaw) {
    const digitsOnly = mobileRaw.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      errors.push(`Insured Mobile Number "${mobileRaw}" must be a 10-digit number`);
    }
  }

  return { errors, row: normalized, newInsurer };
}

export function mapRow(row: Record<string, any>, managersByName: Map<string, any>) {
  const lineOfBusiness = str(row.lineOfBusiness);
  const isMotor = lineOfBusiness === "Motor";
  const manager = str(row.reportingManagerName)
    ? managersByName.get(String(row.reportingManagerName).trim().toLowerCase())
    : undefined;

  const agentType = str(row.agentType)?.toLowerCase();
  const pospPartnerValue =
    agentType === "direct" ? str(row.directAgentName) : str(row.pospPartner);

  return {
    policyNumber: str(row.policyNumber),
    insurer: str(row.insurer),
    policyType: lineOfBusiness,
    lineOfBusiness,
    product: str(row.product),
    transactionType: str(row.transactionType),
    paymentReceivedDate: date(row.paymentReceivedDate),
    policyTypeStructure: str(row.policyTypeStructure),
    mediumOfIssuance: str(row.mediumOfIssuance),
    subInsured: str(row.subInsuredName),
    endorsementNo: "-",
    pospPartner: pospPartnerValue || "Direct Business",
    policyRemark: str(row.policyRemark) || "",
    previousPolicyNo: str(row.previousPolicyNo),
    additionalRemarks: str(row.additionalRemarks),
    status: str(row.status) || "Active",
    startDate: date(row.startDate),
    endDate: date(row.endDate),
    customer: {
      fullName: str(row.insuredName) || "",
      email: str(row.insuredEmail),
      mobile: str(row.insuredMobile),
      address: str(row.address),
    },
    vehicle: isMotor
      ? {
          number: str(row.registrationNumber),
          make: str(row.motorMake),
          model: str(row.product),
          vehicleType: str(row.vehicleType),
          fuelType: str(row.fuelType),
          modelYear: str(row.modelYear),
          itemsCovered: str(row.itemsCovered),
          ncbApplicable: str(row.ncbApplicable),
          caseType: str(row.caseType),
        }
      : undefined,
    assignment: {
      branchName: str(row.branchName),
      reportingManager: manager ? { id: manager._id, name: manager.name } : undefined,
      agentType,
      pospPartner: pospPartnerValue,
    },
    gstAmount: num(row.gstAmount),
    taxRate: num(row.taxRate),
    premium: num(row.premium),
    grossPremium: num(row.grossPremium),
    commissionAmount: num(row.commissionAmount) ?? null,
    payoutAmount: num(row.payoutAmount) ?? null,
    payoutStatus: str(row.payoutStatus) || "PENDING",
    rewardStatus: str(row.rewardStatus),
    commissionRemark: str(row.commissionRemark),
    source: "manual",
  };
}
