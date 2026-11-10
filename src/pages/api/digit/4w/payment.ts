import type { NextApiRequest, NextApiResponse } from "next";
import { getDigitToken } from "@/lib/digitToken";

// Go Digit "Payment Gateway API" (kit API_Curls/paymentAPI.txt) — returns
// Digit's own hosted payment page link for this application. Called once
// KYC is verified (kit's own process flow note).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { applicationId, successReturnUrl, cancelReturnUrl } = req.body || {};
  if (!applicationId) {
    return res.status(400).json({ success: false, message: "applicationId is required" });
  }

  try {
    const token = await getDigitToken();
    if (!token) {
      return res.status(502).json({ success: false, message: "Digit authentication failed" });
    }

    const body = {
      paymentMode: "EB",
      successReturnUrl: successReturnUrl || "",
      cancelReturnUrl: cancelReturnUrl || "",
      applicationId,
    };

    console.log("DIGIT PAYMENT REQUEST", JSON.stringify(body));

    const response = await fetch(`${process.env.DIGIT_BASE_URL}/OneAPI/v1/executor`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
        integrationid: process.env.DIGIT_INTEGRATION_PAYMENT || "",
        "user-agent": "0",
      },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    console.log("DIGIT PAYMENT RAW RESPONSE", response.status, rawText.slice(0, 2000));

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
    if (!data || !data.paymentLink) {
      return res.status(502).json({
        success: false,
        message: data?.error?.validationMessages?.[0] || data?.message || "Digit did not return a payment link",
      });
    }

    return res.status(200).json({
      success: true,
      paymentLink: data.paymentLink,
      premium: data.premium,
      digitPaymentId: data.digitPaymentId,
      requestReference: data.requestReference,
    });
  } catch (err: any) {
    console.log("DIGIT PAYMENT ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
