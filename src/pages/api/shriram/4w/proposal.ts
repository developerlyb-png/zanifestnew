import type { NextApiRequest, NextApiResponse } from "next";
import { buildShriramProposalBody, parseShriramQuote } from "@/lib/shriram4w";

// The PAN card travels as Base64 inside the JSON body
export const config = { api: { bodyParser: { sizeLimit: "8mb" } } };

// Shriram General Insurance — Private Car GenerateProposal.
// Body: { quoteInput, details: ShriramProposalDetails }. Returns the proposal
// number and POL_SYS_ID (Shriram's QuoteId), which payment needs next.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { quoteInput, details } = req.body || {};
  if (!quoteInput || !details) {
    return res.status(400).json({ success: false, message: "quoteInput and details are required" });
  }

  const c = details.customer || {};
  const missing = [
    ["name", c.fullName],
    ["date of birth", c.dob],
    ["mobile", /^\d{10}$/.test(c.mobile || "")],
    ["email", /\S+@\S+\.\S+/.test(c.email || "")],
    ["address", c.address1],
    ["pincode", /^\d{6}$/.test(c.pincode || "")],
    ["father's name", c.fatherName],
    ["nominee", details.nominee?.name && details.nominee?.dob && details.nominee?.relation],
    ["previous insurer", details.previousPolicy?.insurer],
    ["previous policy number", details.previousPolicy?.policyNumber],
    ["PAN", /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(details.kyc?.pan || "")],
    ["Aadhaar number", /^\d{12}$/.test(details.kyc?.aadhaar || "")],
    ["PAN card file", details.panDocument?.base64 && details.panDocument?.ext],
  ]
    .filter(([, ok]) => !ok)
    .map(([label]) => label);
  if (missing.length) {
    return res.status(400).json({ success: false, message: `Missing or invalid: ${missing.join(", ")}` });
  }

  const built = buildShriramProposalBody(quoteInput, details);
  if ("error" in built) {
    return res.status(400).json({ success: false, message: built.error });
  }

  try {
    const response = await fetch(`${process.env.SHRIRAM_BASE_URL}/GenerateProposal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Username: process.env.SHRIRAM_USERNAME || "",
        Password: process.env.SHRIRAM_PASSWORD || "",
      },
      body: JSON.stringify(built.body),
      signal: AbortSignal.timeout(60000),
    });

    const data: any = await response.json().catch(() => null);
    if (!data) {
      return res.status(502).json({
        success: false,
        message: `Shriram returned a non-JSON response (HTTP ${response.status})`,
      });
    }

    // Validation failures come back either as MessageResult.ErrorMessage with
    // no result, or as ERROR_CODE "1" with "PR-0 ..." reasons in ERROR_DESC.
    const result = data.GenerateProposalResult;
    if (data.MessageResult?.Result !== "Success" || !result || String(result.ERROR_CODE) !== "0" || !result.PROPOSAL_NO) {
      return res.status(502).json({
        success: false,
        message: String(result?.ERROR_DESC || data.MessageResult?.ErrorMessage || "Shriram proposal failed")
          .replace(/PR-0\s*/g, "")
          .trim(),
      });
    }

    const premium = parseShriramQuote(result);
    return res.status(200).json({
      success: true,
      proposalNo: result.PROPOSAL_NO,
      quoteId: String(result.POL_SYS_ID),
      idv: premium.idv,
      premium,
      policyType: built.policyType,
    });
  } catch (err: any) {
    console.log("SHRIRAM 4W PROPOSAL ERROR", err);
    const timedOut = err?.name === "TimeoutError";
    return res.status(timedOut ? 504 : 500).json({
      success: false,
      message: timedOut ? "Shriram service did not respond" : err.message,
    });
  }
}
