import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";

async function requireAdmin(req: NextApiRequest) {
  const token = req.cookies["adminToken"];
  const data = token ? await verifyToken(token) : null;

  if (
    !data ||
    typeof data !== "object" ||
    !("role" in data) ||
    !["superadmin", "admin"].includes((data as any).role)
  ) {
    return null;
  }
  return data;
}

// A policy counts as a "renewal" once it's within 90 days of its end
// date (or already past it) — that's the same window the dashboard's
// "Due in 90 Days" bucket covers, so the list and the summary cards stay
// in sync by construction.
const RENEWAL_WINDOW_DAYS = 90;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const windowEnd = new Date();
      windowEnd.setDate(windowEnd.getDate() + RENEWAL_WINDOW_DAYS);

      const policies = await IssuedPolicy.find(
        { endDate: { $exists: true, $ne: null, $lte: windowEnd } },
        {
          "policyDocuments.data": 0,
          "paymentDetails.transactionProof.data": 0,
        }
      )
        .sort({ endDate: 1 })
        .lean();

      return res.status(200).json({ success: true, policies });
    } catch (err: any) {
      console.log("POLICY RENEWALS GET ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { id, renewalStatus, nextFollowUpDate } = req.body || {};
      if (!id) {
        return res.status(400).json({ success: false, message: "id is required" });
      }

      const update: Record<string, any> = {};
      if (renewalStatus !== undefined) update.renewalStatus = renewalStatus;
      if (nextFollowUpDate !== undefined)
        update.nextFollowUpDate = nextFollowUpDate || null;

      const policy = await IssuedPolicy.findByIdAndUpdate(id, update, { new: true }).lean();
      if (!policy) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }

      return res.status(200).json({ success: true, policy });
    } catch (err: any) {
      console.log("POLICY RENEWALS PATCH ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
