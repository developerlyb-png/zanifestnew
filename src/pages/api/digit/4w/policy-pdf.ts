import type { NextApiRequest, NextApiResponse } from "next";
import { getDigitToken } from "@/lib/digitToken";

// Go Digit "PDF Generation" (kit API_Curls/PDF-generation.txt) — returns S3
// links to the policy schedule PDF, not the file itself. Needs a separate
// static partner API key (headerParam.Authorization) that Digit issues
// outside the OAuth token — not yet supplied, so this 502s with a clear
// message until DIGIT_PDF_API_KEY is set in .env.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const policyId = String(req.query.policyId || req.body?.policyId || "").trim();
  if (!policyId) {
    return res.status(400).json({ success: false, message: "A valid policyId (applicationId) is required" });
  }
  if (!process.env.DIGIT_PDF_API_KEY) {
    return res.status(502).json({
      success: false,
      message: "Digit's PDF API key isn't configured yet (DIGIT_PDF_API_KEY).",
    });
  }

  try {
    const token = await getDigitToken();
    if (!token) {
      return res.status(502).json({ success: false, message: "Digit authentication failed" });
    }

    const response = await fetch(`${process.env.DIGIT_BASE_URL}/OneAPI/v1/executor`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
        integrationid: process.env.DIGIT_INTEGRATION_PDF || "",
        "user-agent": "0",
      },
      body: JSON.stringify({
        policyId,
        headerParam: { Authorization: process.env.DIGIT_PDF_API_KEY },
      }),
    });

    const rawText = await response.text();
    console.log("DIGIT PDF RAW RESPONSE", response.status, rawText.slice(0, 1000));

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
    const pdfUrl = data?.schedulePath || data?.schedulePathHC;
    if (!pdfUrl) {
      const message = data?.error?.validationMessages?.[0] || "Digit did not return a policy PDF link";
      if (req.query.format === "json") return res.status(502).json({ success: false, message });
      return res.status(502).send(message);
    }

    // Default: redirect straight to Digit's own PDF link (so an <a href> to
    // this route just opens/downloads the PDF, same as Bajaj's policy-pdf.ts
    // streaming one). ?format=json returns the link itself instead.
    if (req.query.format === "json") {
      return res.status(200).json({ success: true, pdfUrl });
    }
    return res.redirect(302, pdfUrl);
  } catch (err: any) {
    console.log("DIGIT PDF ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
