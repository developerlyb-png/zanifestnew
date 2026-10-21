import type { NextApiRequest, NextApiResponse } from "next";
import { getDigitToken } from "@/lib/digitToken";

// Go Digit motor Quick Quote — POST /OneAPI/v1/executor with the same JSON
// body shape as Digit's API kit sample (Quick_quote.txt). Caller supplies
// contract / vehicle / previousInsurer / pincode; enquiryId and the
// integrationid header come from the server.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const body = req.body || {};
  const missing = ["contract", "vehicle", "previousInsurer", "pincode"].filter((k) => !body[k]);
  if (missing.length) {
    return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
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
        integrationid: process.env.DIGIT_INTEGRATION_QUICK_QUOTE || "",
        "user-agent": "0",
      },
      body: JSON.stringify({
        enquiryId: body.enquiryId || `zanifest-${Date.now()}`,
        contract: body.contract,
        vehicle: body.vehicle,
        previousInsurer: body.previousInsurer,
        pospInfo: body.pospInfo || { isPOSP: "false" },
        pincode: body.pincode,
      }),
    });

    const data: any = await response.json().catch(() => null);
    if (!data) {
      return res.status(502).json({ success: false, message: "Digit returned a non-JSON response" });
    }

    // Digit reports failures in more than one envelope: lowercase `error`
    // (validation), capital `Error` (upstream service), or a bare
    // statusCode. A real quote always carries `contract`.
    const failure = data.error || data.Error;
    const upstreamStatus = Number(data.statusCode) || Number(failure?.httpCode) || 0;
    if (!data.contract || failure || upstreamStatus >= 400) {
      const message =
        failure?.validationMessages?.[0] ||
        (typeof failure === "string" ? failure : null) ||
        failure?.errorLink ||
        data.message ||
        "Digit quick quote failed";
      return res.status(502).json({
        success: false,
        message: typeof message === "string" ? message.slice(0, 300) : "Digit quick quote failed",
        digitStatus: upstreamStatus || undefined,
      });
    }

    return res.status(200).json({ success: true, quote: data });
  } catch (err: any) {
    console.log("DIGIT QUICK QUOTE ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
