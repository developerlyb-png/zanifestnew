import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";

async function getZunoToken() {
  const basic = Buffer.from(
    `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`,
  ).toString("base64");

  const tokenResponse = await axios.post(
    process.env.ZUNO_TOKEN_URL!,
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-key": process.env.ZUNO_X_API_KEY!,
      },
    },
  );

  return tokenResponse.data.access_token;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    await dbConnect();

    const b = req.body;
    console.log("POLICY-ISSUANCE FRONTEND BODY", JSON.stringify(b, null, 2));

    if (!b.quoteId || !b.transactionDetails?.paymentId) {
      return res.status(400).json({
        message: "quoteId and transactionDetails.paymentId are required",
      });
    }

    const payload = {
      transaction_details: {
        payment_id: b.transactionDetails.paymentId,
        amount: b.transactionDetails.amount,
        mode: b.transactionDetails.mode || "UPI",
        instrumentNumber:
          b.transactionDetails.instrumentNumber ||
          b.transactionDetails.paymentId,
      },
      quote_id: b.quoteId,
      source: process.env.ZUNO_SOURCE_ID,
    };

    console.log(
      "ZUNO POLICY-ISSUANCE PAYLOAD",
      JSON.stringify(payload, null, 2),
    );

    const url = `${process.env.ZUNO_HEALTH_URL}/policy-issuance`;
    const token = await getZunoToken();

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": process.env.ZUNO_HEALTH_API_KEY!,
        "Content-Type": "application/json",
      },
    });

    const zunoData = response.data;
    console.log(
      "ZUNO POLICY-ISSUANCE RESPONSE",
      JSON.stringify(zunoData, null, 2),
    );

    // Confirmed live: Zuno's actual response uses completely different
    // keys than their own documented PolicyIssuanceResponse schema —
    // "Policy Number" / "Proposal No" / links["Policy Kit "] (note the
    // real trailing space) / links["E Proposal"], not policy_number /
    // policy_kit_url / e_proposal_url. Falling back to the documented
    // names too in case a future response actually matches them.
    const policyNumber =
      zunoData?.data?.["Policy Number"] ||
      zunoData?.data?.policy_number ||
      `HEALTH-${Date.now()}`;
    const proposalNumber =
      zunoData?.data?.["Proposal No"] || zunoData?.data?.proposal_no || "";
    const policyKitUrl =
      zunoData?.data?.links?.["Policy Kit "] ||
      zunoData?.data?.links?.["Policy Kit"] ||
      zunoData?.data?.policy_kit_url ||
      "";
    const eProposalUrl =
      zunoData?.data?.links?.["E Proposal"] ||
      zunoData?.data?.e_proposal_url ||
      "";

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + Number(b.policyTenure || 1));

    const saved = await IssuedPolicy.create({
      policyNumber,
      proposalNumber,
      quoteNumber: b.quoteId,
      insurer: "Zuno General Insurance",
      product: "Retail Health",
      policyType: "Health",
      customer: {
        fullName: b.customer?.fullName,
        email: b.customer?.email,
        mobile: b.customer?.mobile,
      },
      sumInsured: b.customer?.sumInsured,
      premium: b.transactionDetails.amount,
      status: "ISSUED",
      startDate,
      endDate,
      paymentDetails: {
        mode: b.transactionDetails.mode || "UPI",
        transactionId: b.transactionDetails.paymentId,
        transactionAmount: b.transactionDetails.amount,
      },
    });

    return res.status(200).json({
      success: true,
      policyNumber,
      proposalNumber,
      policyKitUrl,
      eProposalUrl,
      raw: zunoData,
      saved,
    });
  } catch (error: any) {
    console.log(
      "ZUNO POLICY-ISSUANCE ERROR",
      JSON.stringify(error.response?.data || error.message, null, 2),
    );

    return res.status(error.response?.status || 500).json({
      message: "Policy issuance failed",
      error: error.response?.data,
    });
  }
}
