// AI PDF extraction + duplicate-detection helpers for the "Import from
// policy document" admin feature. Ported from the reference
// insurance-crm-mvp's server.mjs (extractPolicy / duplicateKeys /
// duplicateFor), adapted to run against our IssuedPolicy Mongo collection
// instead of its own SQLite table.
//
// Field set matches BULK_UPLOAD_COLUMNS (src/constants/bulkUploadColumns.ts)
// key-for-key, plus a handful of AI-only bonus fields the bulk-upload sheet
// doesn't carry but IssuedPolicy does (proposalNumber, sumInsured, idv,
// nominee, chassisNumber, engineNumber). Using the same keys as bulk upload
// means the saved policy is built with the exact same mapRow()/
// validateAndNormalizeRow() logic bulk upload already uses, instead of a
// second, narrower mapping that only carried ~12 fields.

import IssuedPolicy from "@/models/IssuedPolicy";
import PolicyImport from "@/models/PolicyImport";
import {
  mapRow,
  validateAndNormalizeRow,
  loadReferenceLists,
  type ReferenceLists,
} from "@/utils/policyBulkMapping";

export interface ExtractedPolicy {
  // ---- Same keys as BULK_UPLOAD_COLUMNS ----
  insuredName: string | null;
  subInsuredName: string | null;
  insuredMobile: string | null;
  insuredEmail: string | null;
  address: string | null;
  transactionType: string | null; // New, Rollover, Endorsement, Renewal, Used
  lineOfBusiness: string | null; // Motor, Non Motor
  product: string | null;
  paymentReceivedDate: string | null; // YYYY-MM-DD
  policyTypeStructure: string | null; // e.g. Comprehensive, TP only, SAOD / Family Health, ...
  policyNumber: string | null;
  previousPolicyNo: string | null;
  insurer: string | null;
  policyRemark: string | null; // Policy Received, Policy Pending, Endorsement Received, Endorsement Pending
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
  branchName: string | null;
  agentType: string | null; // Direct, POSP
  pospPartner: string | null; // agent name, when agentType = POSP
  directAgentName: string | null; // agent name, when agentType = Direct
  mediumOfIssuance: string | null; // Online, Offline
  additionalRemarks: string | null;
  status: string | null;
  premium: number | null;
  taxRate: number | null;
  gstAmount: number | null;
  grossPremium: number | null;
  commissionAmount: number | null;
  payoutAmount: number | null;
  payoutStatus: string | null;
  rewardStatus: string | null; // Pending, Received, Not Applicable
  commissionRemark: string | null;
  vehicleType: string | null; // New, Old
  fuelType: string | null; // Petrol, Diesel, CNG, Electric
  modelYear: string | null;
  motorMake: string | null;
  itemsCovered: string | null; // model name
  caseType: string | null;
  registrationNumber: string | null;
  ncbApplicable: string | null; // 0%, 20%, 25%, 35%, 45%, 50%

  // ---- AI-only bonus fields (not in bulk upload, but IssuedPolicy supports them) ----
  proposalNumber: string | null;
  sumInsured: number | null;
  idv: number | null;
  nominee: string | null;
  chassisNumber: string | null;
  engineNumber: string | null;

  // ---- Meta ----
  confidence: number;
  notes: string | null;
}

const nullableString = { type: ["string", "null"] as const };
const nullableNumber = { type: ["number", "null"] as const };

const POLICY_EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    insuredName: nullableString,
    subInsuredName: nullableString,
    insuredMobile: nullableString,
    insuredEmail: nullableString,
    address: nullableString,
    transactionType: nullableString,
    lineOfBusiness: nullableString,
    product: nullableString,
    paymentReceivedDate: { type: ["string", "null"], description: "YYYY-MM-DD" },
    policyTypeStructure: nullableString,
    policyNumber: nullableString,
    previousPolicyNo: nullableString,
    insurer: nullableString,
    policyRemark: nullableString,
    startDate: { type: ["string", "null"], description: "YYYY-MM-DD" },
    endDate: { type: ["string", "null"], description: "YYYY-MM-DD" },
    branchName: nullableString,
    agentType: nullableString,
    pospPartner: nullableString,
    directAgentName: nullableString,
    mediumOfIssuance: nullableString,
    additionalRemarks: nullableString,
    status: nullableString,
    premium: nullableNumber,
    taxRate: nullableNumber,
    gstAmount: nullableNumber,
    grossPremium: nullableNumber,
    commissionAmount: nullableNumber,
    payoutAmount: nullableNumber,
    payoutStatus: nullableString,
    rewardStatus: nullableString,
    commissionRemark: nullableString,
    vehicleType: nullableString,
    fuelType: nullableString,
    modelYear: nullableString,
    motorMake: nullableString,
    itemsCovered: nullableString,
    caseType: nullableString,
    registrationNumber: nullableString,
    ncbApplicable: nullableString,
    proposalNumber: nullableString,
    sumInsured: nullableNumber,
    idv: nullableNumber,
    nominee: nullableString,
    chassisNumber: nullableString,
    engineNumber: nullableString,
    confidence: { type: "number", minimum: 0, maximum: 100 },
    notes: nullableString,
  },
  required: [
    "insuredName", "subInsuredName", "insuredMobile", "insuredEmail", "address", "transactionType",
    "lineOfBusiness", "product", "paymentReceivedDate", "policyTypeStructure", "policyNumber",
    "previousPolicyNo", "insurer", "policyRemark", "startDate", "endDate", "branchName", "agentType",
    "pospPartner", "directAgentName", "mediumOfIssuance", "additionalRemarks", "status", "premium",
    "taxRate", "gstAmount", "grossPremium", "commissionAmount", "payoutAmount", "payoutStatus",
    "rewardStatus", "commissionRemark", "vehicleType", "fuelType", "modelYear", "motorMake",
    "itemsCovered", "caseType", "registrationNumber", "ncbApplicable", "proposalNumber", "sumInsured",
    "idv", "nominee", "chassisNumber", "engineNumber", "confidence", "notes",
  ],
};

const EXTRACTION_PROMPT =
  "Extract every available insurance policy data point from this PDF into the given schema. Use only " +
  "facts present in the document — never invent or guess a value. Return null for any field that isn't " +
  "present or can't be determined. Normalize dates to YYYY-MM-DD and amounts to plain numbers (no currency " +
  "symbols or commas). Guidance for specific fields:\n" +
  "- lineOfBusiness: exactly 'Motor' or 'Non Motor'.\n" +
  "- product: for Motor use one of Pvt Car, 2W, GCV, PCV, 3W, Misc D, Others; for Non Motor use one of " +
  "Health, Travel, PA, GMC, GPA, Fire, Marine, Liability, Home, Pet Insurance, WC, Others.\n" +
  "- policyTypeStructure: for Motor use one of Comprehensive, TP only, SAOD; for Non Motor use one of " +
  "Family Health, Critical Illness, Top Up, Single Transit, Open Policy, Structure only, " +
  "Structure+Contents, Professional Indemnity, Single Trip, Multi Trip, Others.\n" +
  "- transactionType: one of New, Rollover, Endorsement, Renewal, Used.\n" +
  "- mediumOfIssuance: 'Online' or 'Offline' if determinable, else null.\n" +
  "- vehicleType: 'New' or 'Old'. fuelType: Petrol, Diesel, CNG, or Electric.\n" +
  "- ncbApplicable: one of 0%, 20%, 25%, 35%, 45%, 50% if a No Claim Bonus is stated.\n" +
  "- agentType: 'POSP' if an intermediary/agent/POSP name is printed on the document, else 'Direct'; put " +
  "that name in pospPartner (if agentType is POSP) or directAgentName (if agentType is Direct).\n" +
  "- registrationNumber/chassisNumber/engineNumber/motorMake/modelYear/itemsCovered (model name) apply to " +
  "motor policies only — leave null for non-motor policies.\n" +
  "- sumInsured and idv are typically only present on health/life and motor policies respectively.\n" +
  "- notes: anything unusual, ambiguous, or worth a human reviewer's attention; otherwise null.\n" +
  "- confidence is your overall extraction confidence from 0 to 100.";

/**
 * Uploads a PDF (as a data URI) to OpenAI and asks the Responses API to
 * return structured policy fields matching POLICY_EXTRACTION_SCHEMA. Throws
 * on any failure — the caller is responsible for recording that as an
 * import's `error`.
 */
export async function extractPolicyFromPdf(
  dataUri: string,
  originalName: string
): Promise<ExtractedPolicy> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");

  const base64 = dataUri.split(",")[1] || "";
  const bytes = Buffer.from(base64, "base64");

  const form = new FormData();
  form.append("purpose", "user_data");
  form.append("file", new Blob([bytes], { type: "application/pdf" }), originalName);

  const uploadRes = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!uploadRes.ok) {
    throw new Error(`OpenAI file upload failed: ${await uploadRes.text()}`);
  }
  const uploadedFile = await uploadRes.json();

  try {
    const payload = {
      model: process.env.OPENAI_MODEL || "gpt-5",
      store: false,
      input: [
        {
          role: "user",
          content: [
            { type: "input_file", file_id: uploadedFile.id },
            { type: "input_text", text: EXTRACTION_PROMPT },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "insurance_policy",
          strict: true,
          schema: POLICY_EXTRACTION_SCHEMA,
        },
      },
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`OpenAI extraction failed: ${await res.text()}`);
    }
    const data = await res.json();
    const text =
      data.output?.flatMap((o: any) => o.content || []).find((c: any) => c.type === "output_text")
        ?.text || data.output_text;
    if (!text) throw new Error("No structured output returned");
    return JSON.parse(text);
  } finally {
    fetch(`https://api.openai.com/v1/files/${uploadedFile.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${key}` },
    }).catch(() => {});
  }
}

/**
 * Runs (or re-runs) extraction for one PolicyImport document and persists
 * the result — "review" + extracted fields on success, "failed" + error
 * message otherwise. Never throws; both the initial upload and the retry
 * endpoint fire this off in the background and let the review queue poll
 * PolicyImport for the status change.
 */
export async function runExtractionJob(importId: string) {
  try {
    const imp = await PolicyImport.findById(importId);
    if (!imp) return;
    const extracted = await extractPolicyFromPdf(imp.fileData, imp.originalName);
    imp.status = "review";
    imp.extracted = extracted;
    imp.confidence = extracted.confidence;
    imp.error = undefined;
    await imp.save();
  } catch (err: any) {
    await PolicyImport.findByIdAndUpdate(importId, {
      status: "failed",
      error: String(err?.message || err).slice(0, 3000),
    }).catch(() => {});
  }
}

// ---------------- Duplicate detection ----------------

const normText = (v: any) => String(v ?? "").trim().toUpperCase().replace(/\s+/g, " ");
const normPolicy = (v: any) => normText(v).replace(/\s+/g, "");
const normVehicle = (v: any) => normText(v).replace(/[^A-Z0-9]/g, "");
const normChassis = (v: any) => normText(v).replace(/[^A-Z0-9]/g, "");
const normInsurer = (v: any) => normText(v).replace(/[^A-Z0-9]/g, "");

interface DuplicateKey {
  type: string;
  key: string;
  label: string;
}

/** Same priority order as the reference implementation. */
function duplicateKeysFor(x: {
  policyNumber?: any;
  proposalNumber?: any;
  insurer?: any;
  registrationNumber?: any;
  startDate?: any;
  chassisNumber?: any;
}): DuplicateKey[] {
  const out: DuplicateKey[] = [];
  if (normPolicy(x.policyNumber)) {
    out.push({ type: "policy_number", key: normPolicy(x.policyNumber), label: `Policy number ${x.policyNumber}` });
  }
  if (normText(x.proposalNumber) && normInsurer(x.insurer)) {
    out.push({
      type: "proposal_insurer",
      key: `${normText(x.proposalNumber)}|${normInsurer(x.insurer)}`,
      label: `Proposal ${x.proposalNumber} with insurer`,
    });
  }
  if (normVehicle(x.registrationNumber) && normInsurer(x.insurer) && x.startDate) {
    out.push({
      type: "vehicle_insurer_start",
      key: `${normVehicle(x.registrationNumber)}|${normInsurer(x.insurer)}|${x.startDate}`,
      label: `Vehicle ${x.registrationNumber} + insurer + start date`,
    });
  }
  if (normChassis(x.chassisNumber)) {
    out.push({ type: "chassis_number", key: normChassis(x.chassisNumber), label: `Chassis ${x.chassisNumber}` });
  }
  return out;
}

export interface DuplicateMatch {
  id: string;
  policyNumber?: string;
  insuredName?: string;
  vehicleNumber?: string;
  reason: string;
  reasonLabel: string;
}

/** Checks one extracted row against already-saved IssuedPolicy documents. */
export async function findDuplicatePolicy(x: {
  policyNumber?: any;
  proposalNumber?: any;
  insurer?: any;
  registrationNumber?: any;
  startDate?: any;
  chassisNumber?: any;
}): Promise<DuplicateMatch | null> {
  const keys = duplicateKeysFor(x);
  if (keys.length === 0) return null;

  const orClauses: any[] = [];
  if (normPolicy(x.policyNumber)) orClauses.push({ policyNumber: { $exists: true, $ne: null } });
  if (normText(x.proposalNumber)) orClauses.push({ proposalNumber: { $exists: true, $ne: null } });
  if (normVehicle(x.registrationNumber)) orClauses.push({ "vehicle.number": { $exists: true, $ne: null } });
  if (normChassis(x.chassisNumber)) orClauses.push({ "vehicle.chassisNumber": { $exists: true, $ne: null } });
  if (orClauses.length === 0) return null;

  // Pull a bounded candidate set rather than the whole collection, then
  // compare normalized keys in JS (mirrors the reference's in-memory scan).
  const candidates = await IssuedPolicy.find(
    { $or: orClauses },
    {
      policyNumber: 1,
      proposalNumber: 1,
      insurer: 1,
      "customer.fullName": 1,
      startDate: 1,
      "vehicle.number": 1,
      "vehicle.chassisNumber": 1,
    }
  )
    .sort({ createdAt: -1 })
    .limit(2000)
    .lean();

  for (const p of candidates as any[]) {
    const pkeys = duplicateKeysFor({
      policyNumber: p.policyNumber,
      proposalNumber: p.proposalNumber,
      insurer: p.insurer,
      registrationNumber: p.vehicle?.number,
      startDate: p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : undefined,
      chassisNumber: p.vehicle?.chassisNumber,
    });
    const pkeySet = new Set(pkeys.map((k) => `${k.type}:${k.key}`));
    for (const k of keys) {
      if (pkeySet.has(`${k.type}:${k.key}`)) {
        return {
          id: String(p._id),
          policyNumber: p.policyNumber,
          insuredName: p.customer?.fullName,
          vehicleNumber: p.vehicle?.number,
          reason: k.type,
          reasonLabel: k.label,
        };
      }
    }
  }
  return null;
}

/** Detects duplicates *within* a batch of not-yet-saved rows against each other. */
export function batchDuplicateMap(
  rows: { id: string; data: any }[]
): Map<string, { otherId: string; reason: string; reasonLabel: string }> {
  const seen = new Map<string, string>();
  const result = new Map<string, { otherId: string; reason: string; reasonLabel: string }>();

  for (const row of rows) {
    const keys = duplicateKeysFor(row.data || {});
    let matched = false;
    for (const k of keys) {
      const sk = `${k.type}:${k.key}`;
      if (seen.has(sk)) {
        result.set(row.id, { otherId: seen.get(sk)!, reason: k.type, reasonLabel: k.label });
        matched = true;
        break;
      }
    }
    if (!matched) {
      for (const k of keys) seen.set(`${k.type}:${k.key}`, row.id);
    }
  }
  return result;
}

/**
 * Maps an (edited) extraction onto the fields IssuedPolicy.create() expects.
 * Since ExtractedPolicy uses the same keys as the bulk-upload sheet, this
 * runs the extraction through the exact same validateAndNormalizeRow() +
 * mapRow() the bulk-upload endpoints use (canonicalizing dropdown casing,
 * e.g. "motor" -> "Motor") before layering on the AI-only extras bulk upload
 * doesn't carry (proposalNumber, sumInsured, idv, nominee, chassis/engine
 * number, the source PDF itself, etc).
 */
export async function buildPolicyFromExtraction(
  x: Partial<ExtractedPolicy>,
  opts: {
    createdBy: string;
    importId: string;
    fileData?: string;
    originalName?: string;
    refs?: ReferenceLists;
  }
) {
  const refs = opts.refs ?? (await loadReferenceLists());
  const { row: normalized } = validateAndNormalizeRow(x as Record<string, any>, refs);
  const base: any = mapRow(normalized, new Map());

  const vehicleExtras =
    x.chassisNumber || x.engineNumber
      ? { chassisNumber: x.chassisNumber || undefined, engineNumber: x.engineNumber || undefined }
      : undefined;

  return {
    ...base,
    proposalNumber: x.proposalNumber || undefined,
    vehicle:
      base.vehicle || vehicleExtras
        ? { ...(base.vehicle || {}), ...(vehicleExtras || {}) }
        : undefined,
    sumInsured: x.sumInsured ?? undefined,
    idv: x.idv ?? undefined,
    nominee: x.nominee || undefined,
    status: base.status || "Active",
    source: "ai-import",
    createdBy: opts.createdBy,
    aiImportId: opts.importId,
    aiExtractionConfidence: x.confidence ?? undefined,
    policyDocuments:
      opts.fileData && opts.originalName
        ? [{ data: opts.fileData, fileName: opts.originalName }]
        : undefined,
    policyDocumentStatus: opts.fileData ? "Received" : undefined,
  };
}
