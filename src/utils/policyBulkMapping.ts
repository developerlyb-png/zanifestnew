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
): { errors: string[]; row: Record<string, any> } {
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
  checkEnum("insurer", "Insurance Company", refs.insurers);
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

  return { errors, row: normalized };
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
