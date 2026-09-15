import type { NextApiRequest, NextApiResponse } from "next";
import { iciciHealthRequest, iciciClientSlug } from "@/lib/iciciHealth";

// Step 2 — submit proposer/insured/nominee details for a quote's
// TransactionId; returns a PaymentUrl to redirect the customer to.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const data = await iciciHealthRequest(
      `/health-fresh/elevate/${iciciClientSlug()}/proposal-payment`,
      req.body
    );
    console.log("ICICI HEALTH PROPOSAL-PAYMENT RESPONSE", JSON.stringify(data));
    return res.status(200).json(data);
  } catch (err: any) {
    console.log("ICICI HEALTH PROPOSAL-PAYMENT ERROR", JSON.stringify(err.response?.data || err.message));
    return res.status(err.response?.status || 500).json({
      success: false,
      message: "Proposal submission failed",
      error: err.response?.data || err.message,
    });
  }
}
