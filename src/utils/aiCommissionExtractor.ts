// AI PDF extraction for commission statements — the Reconciliation feature's
// "Upload Commission Statement" previously only accepted XLSX/XLS/CSV
// (parsed with the `xlsx` package + a per-insurer column-header mapping in
// InsuranceReconcileMapping). Insurers also send these as PDFs, which have
// no machine-readable column headers to map against, so this extracts the
// same canonical fields directly via OpenAI's Responses API — the same
// upload/structured-output mechanics as src/utils/aiPolicyExtractor.ts, just
// with an array-of-rows schema since one statement covers many policies.
//
// Known limitation: a single Responses API call has an output-token ceiling.
// A statement with a very large number of rows (low hundreds or more,
// depending on how verbose each row is) can get truncated by the model
// before every row is emitted. There's no chunking/pagination here — for
// very large PDFs, splitting the statement or using the XLSX/CSV upload
// path (which has no such limit) is the safer choice until that's built.

export interface ExtractedCommissionRow {
  policyNo: string | null;
  insuredName: string | null;
  premium: number | null;
  commissionAmount: number | null;
  commissionPercentage: number | null;
  basicPremiumAmount: number | null;
  odPremiumAmount: number | null;
  tpPremiumAmount: number | null;
  terrorismPremiumAmount: number | null;
}

const nullableString = { type: ["string", "null"] as const };
const nullableNumber = { type: ["number", "null"] as const };

const COMMISSION_ROW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    policyNo: nullableString,
    insuredName: nullableString,
    premium: nullableNumber,
    commissionAmount: nullableNumber,
    commissionPercentage: nullableNumber,
    basicPremiumAmount: nullableNumber,
    odPremiumAmount: nullableNumber,
    tpPremiumAmount: nullableNumber,
    terrorismPremiumAmount: nullableNumber,
  },
  required: [
    "policyNo",
    "insuredName",
    "premium",
    "commissionAmount",
    "commissionPercentage",
    "basicPremiumAmount",
    "odPremiumAmount",
    "tpPremiumAmount",
    "terrorismPremiumAmount",
  ],
};

const COMMISSION_STATEMENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    rows: { type: "array", items: COMMISSION_ROW_SCHEMA },
  },
  required: ["rows"],
};

const EXTRACTION_PROMPT =
  "Extract every row of this insurance commission statement into the given schema — one entry per " +
  "policy, in the same order as the document. Use only facts present in the document; never invent or " +
  "guess a value, and use null for any field a row doesn't have. Numbers must be plain (no currency " +
  "symbols, commas, or % signs) — e.g. a 15% commission rate is 15, not '15%' or 0.15. Field guidance:\n" +
  "- policyNo: the policy/certificate number for that row.\n" +
  "- insuredName: the insured/customer name for that row.\n" +
  "- premium: the total/gross premium for that policy.\n" +
  "- commissionAmount: the total commission amount paid for that policy.\n" +
  "- commissionPercentage: the commission rate, if shown.\n" +
  "- basicPremiumAmount: a 'Basic' premium column, if the statement has one (separate from OD/TP).\n" +
  "- odPremiumAmount: the Own Damage (OD) premium, if shown separately.\n" +
  "- tpPremiumAmount: the Third Party / Liability (TP) premium, if shown separately.\n" +
  "- terrorismPremiumAmount: the terrorism premium, if shown separately.\n" +
  "Include every row/policy listed in the statement, however many there are — do not summarize, " +
  "de-duplicate, or stop early.";

export async function extractCommissionRowsFromPdf(
  dataUri: string,
  originalName: string
): Promise<ExtractedCommissionRow[]> {
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
          name: "commission_statement",
          strict: true,
          schema: COMMISSION_STATEMENT_SCHEMA,
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
    const parsed = JSON.parse(text);
    return Array.isArray(parsed.rows) ? parsed.rows : [];
  } finally {
    fetch(`https://api.openai.com/v1/files/${uploadedFile.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${key}` },
    }).catch(() => {});
  }
}
