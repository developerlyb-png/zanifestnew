import type { NextApiRequest, NextApiResponse } from "next";
import { iciciHealthRequest, iciciClientSlug } from "@/lib/iciciHealth";

// KYC via CKYC lookup (preferred path — PAN/Aadhaar/CKYC number). Falls back
// to ovd-initiate.ts (document upload) when CKYC has no record.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const data = await iciciHealthRequest(
      `/generic/common/ckyc/${iciciClientSlug()}/health/ckyc`,
      req.body
    );
    console.log("ICICI HEALTH CKYC RESPONSE", JSON.stringify(data));
    return res.status(200).json(data);
  } catch (err: any) {
    console.log("ICICI HEALTH CKYC ERROR", JSON.stringify(err.response?.data || err.message));
    return res.status(err.response?.status || 500).json({
      success: false,
      message: "CKYC lookup failed",
      error: err.response?.data || err.message,
    });
  }
}
