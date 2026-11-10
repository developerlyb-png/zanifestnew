import type { NextApiRequest, NextApiResponse } from "next";
import { getDigitToken } from "@/lib/digitToken";

// Go Digit "KYC Verification" (kit API_Curls/KYC-Verification.txt) — we
// don't collect ID/address proof files ourselves, so this is sent
// intentionally incomplete; Digit's own reply still hands back a hosted
// `link` the customer finishes real KYC on (same pattern as Zuno/SBI's
// hosted CKYC elsewhere in this app).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { policyNumber, dob, gender } = req.body || {};
  if (!policyNumber || !dob || !gender) {
    return res.status(400).json({ success: false, message: "policyNumber, dob and gender are required" });
  }

  try {
    const token = await getDigitToken();
    if (!token) {
      return res.status(502).json({ success: false, message: "Digit authentication failed" });
    }

    const body = {
      policyHolderType: "INDIVIDUAL",
      addressVerificationDoc: [""],
      addressVerificationDocType: "D25",
      failureReturnURL: "",
      gender: gender === "Female" ? "F" : "M",
      successReturnURL: "",
      dateOfBirth: dob,
      externalReferenceNumber: policyNumber,
      idVerificationDoc: [""],
      queryParam: { companyFlag: "GI", policyNumber },
      idVerificationDocType: "D25",
    };

    console.log("DIGIT KYC VERIFY REQUEST", JSON.stringify(body));

    const response = await fetch(`${process.env.DIGIT_BASE_URL}/OneAPI/v1/executor`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
        integrationid: process.env.DIGIT_INTEGRATION_KYC_VERIFICATION || "",
        "user-agent": "0",
      },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    console.log("DIGIT KYC VERIFY RAW RESPONSE", response.status, rawText.slice(0, 2000));

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
    if (!data || !data.link) {
      return res.status(502).json({
        success: false,
        message: data?.kycReason || "Digit did not return a KYC link",
      });
    }

    return res.status(200).json({ success: true, link: data.link, status: data.kycVerificationStatus });
  } catch (err: any) {
    console.log("DIGIT KYC VERIFY ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
