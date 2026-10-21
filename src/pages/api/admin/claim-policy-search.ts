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

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Typeahead for the "Policy Number" field on Create New Claim — returns just
// what's needed to auto-fill the claim form (never the policy documents).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  try {
    await dbConnect();

    const q = String(req.query.q || "").trim();
    const filter: any = { policyNumber: { $exists: true, $ne: null } };
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ policyNumber: rx }, { "customer.fullName": rx }];
    }

    const policies = await IssuedPolicy.find(filter, {
      policyNumber: 1,
      insurer: 1,
      lineOfBusiness: 1,
      policyType: 1,
      product: 1,
      "customer.fullName": 1,
      "customer.email": 1,
      "customer.mobile": 1,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({ success: true, policies });
  } catch (err: any) {
    console.log("CLAIM POLICY SEARCH ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
