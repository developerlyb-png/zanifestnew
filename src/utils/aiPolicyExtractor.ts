// AI PDF extraction + duplicate-detection helpers for the "Import from
// policy document" admin feature. Ported from the reference
// insurance-crm-mvp's server.mjs (extractPolicy / duplicateKeys /
// duplicateFor), adapted to run against our IssuedPolicy Mongo collection
// instead of its own SQLite table.

import IssuedPolicy from "@/models/IssuedPolicy";
import PolicyImport from "@/models/PolicyImport";

export interface ExtractedPolicy {
  policy_number: string | null;
  proposal_number: string | null;
  insured_name: string | null;
  mobile: string | null;
  email: string | null;
  insurer: string | null;
  policy_type: string | null;
  product_name: string | null;
  start_date: string | null;
  end_date: string | null;
  gross_premium: number | null;
  net_premium: number | null;
  gst: number | null;
  sum_insured: number | null;
  idv: number | null;
  vehicle_number: string | null;
  make_model: string | null;
  engine_number: string | null;
  chassis_number: string | null;
  nominee: string | null;
  agent_broker_name: string | null;
  confidence: number;
  notes: string | null;
}

const POLICY_EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    policy_number: { type: ["string", "null"] },
    proposal_number: { type: ["string", "null"] },
    insured_name: { type: ["string", "null"] },
    mobile: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    insurer: { type: ["string", "null"] },
    policy_type: { type: ["string", "null"] },
    product_name: { type: ["string", "null"] },
    start_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
    end_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
    gross_premium: { type: ["number", "null"] },
    net_premium: { type: ["number", "null"] },
    gst: { type: ["number", "null"] },
    sum_insured: { type: ["number", "null"] },
    idv: { type: ["number", "null"] },
    vehicle_number: { type: ["string", "null"] },
    make_model: { type: ["string", "null"] },
    engine_number: { type: ["string", "null"] },
    chassis_number: { type: ["string", "null"] },
    nominee: { type: ["string", "null"] },
    agent_broker_name: { type: ["string", "null"] },
    confidence: { type: "number", minimum: 0, maximum: 100 },
    notes: { type: ["string", "null"] },
  },
  required: [
    "policy_number", "proposal_number", "insured_name", "mobile", "email", "insurer",
    "policy_type", "product_name", "start_date", "end_date", "gross_premium", "net_premium",
    "gst", "sum_insured", "idv", "vehicle_number", "make_model", "engine_number",
    "chassis_number", "nominee", "agent_broker_name", "confidence", "notes",
  ],
};

const EXTRACTION_PROMPT =
  "Extract insurance policy data from this PDF. Use only facts present in the document. " +
  "Return null when a field is unavailable. Normalize dates to YYYY-MM-DD and amounts to numbers. " +
  "policy_type should be a concise category such as Motor, Health, Life, Travel, Fire, Marine, or Other. " +
  "confidence is an overall extraction confidence from 0 to 100.";

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
  policy_number?: any;
  proposal_number?: any;
  insurer?: any;
  vehicle_number?: any;
  start_date?: any;
  chassis_number?: any;
}): DuplicateKey[] {
  const out: DuplicateKey[] = [];
  if (normPolicy(x.policy_number)) {
    out.push({ type: "policy_number", key: normPolicy(x.policy_number), label: `Policy number ${x.policy_number}` });
  }
  if (normText(x.proposal_number) && normInsurer(x.insurer)) {
    out.push({
      type: "proposal_insurer",
      key: `${normText(x.proposal_number)}|${normInsurer(x.insurer)}`,
      label: `Proposal ${x.proposal_number} with insurer`,
    });
  }
  if (normVehicle(x.vehicle_number) && normInsurer(x.insurer) && x.start_date) {
    out.push({
      type: "vehicle_insurer_start",
      key: `${normVehicle(x.vehicle_number)}|${normInsurer(x.insurer)}|${x.start_date}`,
      label: `Vehicle ${x.vehicle_number} + insurer + start date`,
    });
  }
  if (normChassis(x.chassis_number)) {
    out.push({ type: "chassis_number", key: normChassis(x.chassis_number), label: `Chassis ${x.chassis_number}` });
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
  policy_number?: any;
  proposal_number?: any;
  insurer?: any;
  vehicle_number?: any;
  start_date?: any;
  chassis_number?: any;
}): Promise<DuplicateMatch | null> {
  const keys = duplicateKeysFor(x);
  if (keys.length === 0) return null;

  const orClauses: any[] = [];
  if (normPolicy(x.policy_number)) orClauses.push({ policyNumber: { $exists: true, $ne: null } });
  if (normText(x.proposal_number)) orClauses.push({ proposalNumber: { $exists: true, $ne: null } });
  if (normVehicle(x.vehicle_number)) orClauses.push({ "vehicle.number": { $exists: true, $ne: null } });
  if (normChassis(x.chassis_number)) orClauses.push({ "vehicle.chassisNumber": { $exists: true, $ne: null } });
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
      policy_number: p.policyNumber,
      proposal_number: p.proposalNumber,
      insurer: p.insurer,
      vehicle_number: p.vehicle?.number,
      start_date: p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : undefined,
      chassis_number: p.vehicle?.chassisNumber,
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

const toDate = (v: any) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** Maps an (edited) extraction onto the fields IssuedPolicy.create() expects. */
export function buildPolicyFromExtraction(
  x: Partial<ExtractedPolicy>,
  opts: { createdBy: string; importId: string; fileData?: string; originalName?: string }
) {
  return {
    policyNumber: x.policy_number || undefined,
    proposalNumber: x.proposal_number || undefined,
    insurer: x.insurer || undefined,
    policyType: x.policy_type || undefined,
    lineOfBusiness: x.policy_type || undefined,
    product: x.product_name || undefined,
    customer: {
      fullName: x.insured_name || "",
      email: x.email || undefined,
      mobile: x.mobile || undefined,
    },
    vehicle:
      x.vehicle_number || x.make_model || x.chassis_number || x.engine_number
        ? {
            number: x.vehicle_number || undefined,
            model: x.make_model || undefined,
            chassisNumber: x.chassis_number || undefined,
            engineNumber: x.engine_number || undefined,
          }
        : undefined,
    startDate: toDate(x.start_date),
    endDate: toDate(x.end_date),
    premium: x.net_premium ?? undefined,
    grossPremium: x.gross_premium ?? undefined,
    gstAmount: x.gst ?? undefined,
    sumInsured: x.sum_insured ?? undefined,
    idv: x.idv ?? undefined,
    nominee: x.nominee || undefined,
    pospPartner: x.agent_broker_name || "Direct Business",
    status: "Active",
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
