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

    // =====================
    // ZUNO 2W ISSUE PAYLOAD
    // NOTE: the 2W collection uses "policyList" —
    // NOT the 4W's policyRequest.issuePolicyList wrapper.
    // =====================
    const item: any = {
      quoteNo: String(quoteNo),
      quoteOptionNo: String(quoteOptionNo),
      [kycField]: String(kycNo),
    };
    if (fqPolicyNumber) {
      // key-name variants for the pre-allocated policy number
      item.policyNumber = String(fqPolicyNumber);
      item.policyNo = String(fqPolicyNumber);
    }

    // The 2W validator accepted the policyRequest.issuePolicyList
    // structure (it reached the core with it), and rejected a bare
    // "policyList" with "Missing or empty policy list" — so
    // issuePolicyList is the recognized key. We include policyList
    // too for safety.
    const issuePayload = {
      ...item,

      product: {
        name: "EGICProductWebServicesV1",
        version: "1",
      },

      policyList: [item],
      issuePolicyList: [item],

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