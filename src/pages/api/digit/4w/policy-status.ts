import type { NextApiRequest, NextApiResponse } from "next";
import { getDigitToken } from "@/lib/digitToken";

// Go Digit "Policy Status" (kit API_Curls/policyStatus.txt) — same payload
// shape as create-quote's response, plus kycStatus/payment once those are
// done. Used to poll whether KYC finished on Digit's hosted page, and later
// whether the policy went EFFECTIVE after payment.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const policyNumber = String(
    req.method === "GET" ? req.query.policyNumber : req.body?.policyNumber || ""
  ).trim();
  if (!policyNumber) {
    return res.status(400).json({ success: false, message: "policyNumber is required" });
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
        integrationid: process.env.DIGIT_INTEGRATION_POLICY_STATUS || "",
        "user-agent": "0",
      },
      body: JSON.stringify({ queryParam: { policyNumber } }),
    });

    const rawText = await response.text();
    console.log("DIGIT POLICY STATUS RAW RESPONSE", response.status, rawText.slice(0, 2000));

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
    if (!data || !data.policyNumber) {
      return res.status(502).json({ success: false, message: "Digit did not return a policy status" });
    }

    return res.status(200).json({
      success: true,
      policyNumber: data.policyNumber,
      policyStatus: data.policyStatus,
      kycVerificationStatus: data.kycStatus?.kycVerificationStatus,
      paymentStatus: data.kycStatus?.paymentStatus,
      applicationId: data.applicationId,
      status: data,
    });
  } catch (err: any) {
    console.log("DIGIT POLICY STATUS ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
