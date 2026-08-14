// pages/api/sbi/2w/issue-policy.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";

// ================= TOKEN =================
async function getZunoToken() {
  const auth = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
  ).toString("base64");
  const response = await fetch(`${process.env.ZUNO_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "x-api-key": process.env.ZUNO_X_API_KEY!,
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();
  return data.access_token;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    await dbConnect();

    // Accept both the new cart shape ({quoteNo, quoteOptionNo, kycNo})
    // and the old shape ({fullQuote, ...})
    const quoteNo =
      req.body.quoteNo ||
      req.body.fullQuote?.policyLevelDetails?.quoteNo ||
      req.body.fullQuote?.policyLevelDetails?.quoteNumber;
    const quoteOptionNo =
      req.body.quoteOptionNo ||
      req.body.fullQuote?.policyLevelDetails?.quoteOptionNo ||
      req.body.fullQuote?.policyLevelDetails?.quoteOptionNumber;
    const kycNo = req.body.kycNo;
    // 2W full-quote pre-allocates a policy number — carry it forward
    const fqPolicyNumber =
      req.body.policyNumber ||
      req.body.fullQuote?.policyLevelDetails?.policyNumber ||
      "";

    console.log("2W ISSUE INPUT >>>", {
      quoteNo,
      quoteOptionNo,
      kycNo,
      fqPolicyNumber,
    });

    if (!quoteNo || !quoteOptionNo) {
      return res
        .status(400)
        .json({ success: false, message: "Quote details missing" });
    }

    if (!kycNo) {
      return res.status(400).json({
        success: false,
        message: "kycNo is required (VISoF_KYC_Req_No value)",
      });
    }

    // KYC field — same validator family as 4W:
    // "Please provide either VISoF_KYC_Req_No or IC_KYC_No"
    const kycField =
      req.body.kycField === "IC_KYC_No" ? "IC_KYC_No" : "VISoF_KYC_Req_No";

    // The 2W e-KYC step's response always carries a "zuno-" prefix
    // (our own tracking prefix layered on Zuno's raw numeric reference).
    // Zuno's core service almost certainly expects the raw reference,
    // not this prefixed string — strip it by default (unlike 4W, whose
    // KYC values don't normally carry this prefix, so 4W leaves it opt-in).
    // Pass stripKycPrefix: false explicitly to send the raw kycNo unmodified.
    const kycValue =
      req.body.stripKycPrefix === false
        ? String(kycNo)
        : String(kycNo).replace(/^zuno-/i, "");

    // =====================
    // ZUNO 2W ISSUE PAYLOAD
    // Mirrors the 4W payload shape exactly (src/pages/api/zuno/4w/issue-policy.ts),
    // which is confirmed working. Earlier iterations here kept stacking extra
    // top-level "policyList"/"issuePolicyList" wrappers and a policyNumber/policyNo
    // field to satisfy Zuno's input *validator* one error at a time — but that bloated,
    // redundant shape is what the core service then rejects with a generic E1205.
    // Passing a pre-allocated policy number isn't part of the working 4W shape either,
    // so it's dropped from the outgoing request (fqPolicyNumber is still used below
    // purely as a fallback when saving our own IssuedPolicy record).
    // =====================
    const item: any = {
      quoteNo: String(quoteNo),
      quoteOptionNo: String(quoteOptionNo),
      [kycField]: kycValue,
    };

    const issuePayload = {
      ...item,

      product: {
        name: "EGICProductWebServicesV1",
        version: "1",
      },

      policyRequest: {
        ...item,
        issuePolicyList: [{ ...item, issuePolicy: { ...item } }],
      },

      ipContextInfo: {
        productName: "EGICProductWebServicesV1",
        productVersion: "1",
      },
    };

    console.log("2W FINAL ISSUE PAYLOAD", JSON.stringify(issuePayload));

    const token = await getZunoToken();

    const response = await fetch(
      `${process.env.ZUNO_BASE_URL}/motor-two-wheeler/issue-policy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": process.env.ZUNO_X_API_KEY!,
        },
        body: JSON.stringify(issuePayload),
      }
    );

    const text = await response.text();
    console.log("2W ISSUE STATUS", response.status);
    console.log("2W ISSUE RAW", text.slice(0, 4000));

    let zunoData: any;
    try {
      zunoData = JSON.parse(text);
    } catch {
      zunoData = text;
    }

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ success: false, data: zunoData });
    }

    // =====================
    // EXTRACT POLICY NUMBER
    // 4W shape: issuePolicyObject.issuepolicy.policynrTt
    // plus the old candidates just in case 2W differs
    // =====================
    const policyNumber =
      zunoData?.issuePolicyObject?.issuepolicy?.policynrTt ||
      zunoData?.PolicyNr ||
      zunoData?.policyNumber ||
      fqPolicyNumber ||
      Date.now().toString();

    console.log("2W POLICY NO >>>", policyNumber);

    // =====================
    // SAVE POLICY
    // =====================
    const existing = await IssuedPolicy.findOne({ policyNumber });
    if (existing) {
      return res.status(200).json({
        success: true,
        data: {
          ...zunoData,
          saved: existing,
        },
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const saved = await IssuedPolicy.create({
      policyNumber,
      quoteNumber:
        zunoData?.issuePolicyObject?.issuepolicy?.zzquotenoVl ||
        zunoData?.zzQuoteNo ||
        quoteNo,
      quoteOptionNumber:
        zunoData?.issuePolicyObject?.issuepolicy?.zzquoteoptnoVl ||
        zunoData?.zzQuoteOptNo ||
        quoteOptionNo,
      customer: req.body.customer,
      vehicle: req.body.vehicle,
      premium: req.body.premium,
      status: "ISSUED",
      startDate,
      endDate,
      zunoResponse: zunoData,
    });

    // Return the Zuno response shape the cart expects
    // (issuePolicyObject...) plus the DB record
    return res.status(200).json({
      success: true,
      data: {
        ...zunoData,
        saved,
      },
    });
  } catch (error: any) {
    console.log("2W ISSUE ERROR", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}