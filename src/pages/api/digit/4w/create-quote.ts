import type { NextApiRequest, NextApiResponse } from "next";
import { getDigitToken } from "@/lib/digitToken";
import { buildDigitCreateQuoteBody, DigitProposer } from "@/lib/digit4wRequestBuilder";

// Go Digit "Create Quote" (kit API_Curls/create_quote.txt) — issues the
// quote number (policyNumber) + applicationId the rest of the flow (KYC,
// payment, PDF) needs. Same executor endpoint as quick quote, different
// integrationid.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { quoteInput, proposer } = (req.body || {}) as { quoteInput: any; proposer: DigitProposer };
  if (!quoteInput || !proposer) {
    return res.status(400).json({ success: false, message: "quoteInput and proposer are required" });
  }

  const missing = [
    "firstName", "lastName", "dob", "gender", "mobile", "email",
    "address1", "city", "state", "pincode", "nomineeName", "nomineeRelation",
  ].filter((k) => !String((proposer as any)[k] || "").trim());
  if (missing.length) {
    return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
  }

  const built = buildDigitCreateQuoteBody(quoteInput, proposer);
  if ("error" in built) {
    return res.status(200).json({ success: false, message: built.error });
  }

  try {
    const token = await getDigitToken();
    if (!token) {
      return res.status(502).json({ success: false, message: "Digit authentication failed" });
    }

    console.log("DIGIT CREATE QUOTE REQUEST", JSON.stringify(built.body));

    const response = await fetch(`${process.env.DIGIT_BASE_URL}/OneAPI/v1/executor`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
        integrationid: process.env.DIGIT_INTEGRATION_CREATE_QUOTE || "",
        "user-agent": "0",
      },
      body: JSON.stringify(built.body),
    });

    const rawText = await response.text();
    console.log("DIGIT CREATE QUOTE RAW RESPONSE", response.status, rawText.slice(0, 3000));

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
    if (!data) {
      return res.status(502).json({ success: false, message: "Digit returned a non-JSON response" });
    }

    // Same benign-envelope rule as quickquote.ts — error.errorCode 0 /
    // httpCode 200 is present even on success.
    const failure = data.error || data.Error;
    const upstreamStatus = Number(failure?.httpCode) || 0;
    const hasRealFailure =
      typeof failure === "string"
        ? failure.trim().length > 0
        : !!failure &&
          ((Number(failure.errorCode) || 0) !== 0 ||
            upstreamStatus >= 400 ||
            (Array.isArray(failure.validationMessages) && failure.validationMessages.length > 0) ||
            !!failure.errorStackTrace ||
            !!failure.errorLink);
    if (!data.policyNumber || hasRealFailure) {
      const message =
        (typeof failure === "string" ? failure : null) ||
        failure?.validationMessages?.[0] ||
        failure?.errorLink ||
        data.message ||
        "Digit could not create the quote";
      return res.status(502).json({
        success: false,
        message: typeof message === "string" ? message.slice(0, 300) : "Digit could not create the quote",
        digitStatus: upstreamStatus || undefined,
      });
    }

    return res.status(200).json({
      success: true,
      policyNumber: data.policyNumber,
      applicationId: data.applicationId,
      kycVerificationStatus: data.kycStatus?.kycVerificationStatus,
      netPremium: data.netPremium,
      grossPremium: data.grossPremium,
      quote: data,
    });
  } catch (err: any) {
    console.log("DIGIT CREATE QUOTE ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
