// POST /api/sbi/gcv/issuance — converts a paid FullQuote into a policy.
// Body: { quotationNo, amount, payerName, paymentReferenceNo, ckycTags }
// ckycTags must be the SAME values sent on FullQuote; SBI refuses issuance
// without a valid CKYC ("No Valid CKYC").
import type { NextApiRequest, NextApiResponse } from "next";
import { sbiGcvPost } from "@/lib/sbiGcv/client";
import { SBI_GCV_PATHS } from "@/lib/sbiGcv/constants";
import { buildGcvIssuanceBody, sbiErrorMessages } from "@/lib/sbiGcv/requestBuilder";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  const { quotationNo, amount, payerName, paymentReferenceNo, ckycTags } = req.body || {};
  if (!quotationNo || amount == null || !payerName || !paymentReferenceNo) {
    return res.status(400).json({
      success: false,
      message: "quotationNo, amount, payerName and paymentReferenceNo are required",
    });
  }

  try {
    const { raw } = await sbiGcvPost(
      SBI_GCV_PATHS.issuance,
      "getIssurance",
      buildGcvIssuanceBody({ quotationNo, amount: Number(amount), payerName, paymentReferenceNo, ckycTags })
    );

    const errors = sbiErrorMessages(raw);
    if (errors || !raw?.PolicyNo) {
      return res.status(200).json({
        success: false,
        message: errors?.[0] || "SBI did not return a policy number",
        errors,
        data: raw,
      });
    }

    return res.status(200).json({
      success: true,
      policyNo: raw.PolicyNo,
      issueDate: raw.IssueDate,
      duePremium: raw.DuePremium,
      data: raw,
    });
  } catch (error: any) {
    console.log("SBI GCV ISSUANCE ERROR", error.response?.data || error.message);
    return res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
}
