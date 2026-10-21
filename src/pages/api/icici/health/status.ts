import type { NextApiRequest, NextApiResponse } from "next";
import { iciciHealthRequest, iciciClientSlug } from "@/lib/iciciHealth";

// Poll a proposal/policy's status by TransactionId (see Masters Data's
// Status sheet for the code meanings: NCN=Rejected, NC=Policy generated,
// ACDC=Cancelled, NCCN=Proposal generated, CUWP=Counter offer,
// NPA=Pending approval, NPMR=Pending medical reports).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Only POST allowed" });
  }

  try {
    const data = await iciciHealthRequest(
      `/health-servicing/proposal/${iciciClientSlug()}/status`,
      req.body
    );
    console.log("ICICI HEALTH STATUS RESPONSE", JSON.stringify(data));
    return res.status(200).json(data);
  } catch (err: any) {
    console.log("ICICI HEALTH STATUS ERROR", JSON.stringify(err.response?.data || err.message));
    return res.status(err.response?.status || 500).json({
      success: false,
      message: "Status check failed",
      error: err.response?.data || err.message,
    });
  }
}
