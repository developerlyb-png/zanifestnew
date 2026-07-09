import type { NextApiRequest, NextApiResponse } from "next";

async function getZunoToken() {
  const auth = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
  ).toString("base64");
  const r = await fetch(process.env.ZUNO_TOKEN_URL!, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const d = await r.json();
  return d.access_token;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST" });
  }

  try {
    const { quoteNo, quoteOptionNo, kycNo } = req.body;

    if (!quoteNo || !quoteOptionNo) {
      return res.status(400).json({
        success: false,
        message: "quoteNo and quoteOptionNo are required",
      });
    }

    if (!kycNo) {
      return res.status(400).json({
        success: false,
        message: "kycNo (IC_Unique_ID from KYC) is required",
      });
    }

    // Superset payload — quote numbers in every plausible location
    // (runtime validator differs from the Swagger sample), plus the KYC ref.
    const payload = {
      // top-level (flat)
      quoteNo: String(quoteNo),
      quoteOptionNo: String(quoteOptionNo),
      IC_KYC_No: String(kycNo),

      product: {
        name: "EGICProductWebServicesV1",
        version: "1",
      },

      policyRequest: {
        // directly under policyRequest
        quoteNo: String(quoteNo),
        quoteOptionNo: String(quoteOptionNo),
        IC_KYC_No: String(kycNo),

        issuePolicyList: [
          {
            // documented shape
            quoteNo: String(quoteNo),
            quoteOptionNo: String(quoteOptionNo),
            IC_KYC_No: String(kycNo),
            // wrapped shape (2W collection style)
            issuePolicy: {
              quoteNo: String(quoteNo),
              quoteOptionNo: String(quoteOptionNo),
              IC_KYC_No: String(kycNo),
            },
          },
        ],
      },

      ipContextInfo: {
        productName: "EGICProductWebServicesV1",
        productVersion: "1",
      },
    };

    console.log("4W ISSUE PAYLOAD", JSON.stringify(payload));

    const token = await getZunoToken();
    console.log("4W ISSUE TOKEN:", token ? "YES" : "NO");

    const url = `${process.env.ZUNO_MOTOR_URL}/issue-policy`;
    console.log("CALLING", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-api-key": process.env.ZUNO_MOTOR_API_KEY!,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("4W ISSUE STATUS", response.status);
    console.log("4W ISSUE RAW", text.slice(0, 4000));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(response.status).json({ success: response.ok, data });
  } catch (e: any) {
    console.log("4W ISSUE ERROR", e);
    return res.status(500).json({ success: false, message: e.message });
  }
}