import type { NextApiRequest, NextApiResponse } from "next";
import { iciciHealthRequest, iciciClientSlug } from "@/lib/iciciHealth";

// Step 1 of the Elevate Fresh flow — get a premium quote.
// Confirmed live against ICICI's UAT environment (2026-09-14): plain JSON in,
// plain JSON out, Bearer token only — no request/response encryption.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const data = await iciciHealthRequest(
      `/health-fresh/elevate/${iciciClientSlug()}/premium`,
      req.body
    );
    console.log("ICICI HEALTH PREMIUM RESPONSE", JSON.stringify(data));
    return res.status(200).json(data);
  } catch (err: any) {
    console.log("ICICI HEALTH PREMIUM ERROR", JSON.stringify(err.response?.data || err.message));
    return res.status(err.response?.status || 500).json({
      success: false,
      message: "Premium request failed",
      error: err.response?.data || err.message,
    });
  }
}
