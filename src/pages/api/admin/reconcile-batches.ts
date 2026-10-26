import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import ReconciliationBatch from "@/models/ReconciliationBatch";

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    await dbConnect();
    const { id, from, to } = req.query;

    if (id) {
      const batch = await ReconciliationBatch.findById(String(id)).lean();
      if (!batch) return res.status(404).json({ success: false, message: "Reconciliation batch not found" });
      return res.status(200).json({ success: true, batch });
    }

    const query: any = {};
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(String(from));
      if (to) query.createdAt.$lte = new Date(String(to));
    }

    // List projection excludes the heavy base64 file + full per-policy
    // results array — the dashboard only needs the summary counts.
    const batches = await ReconciliationBatch.find(query, { fileData: 0, results: 0 })
      .sort({ batchNo: -1 })
      .limit(500)
      .lean();

    return res.status(200).json({ success: true, batches });
  } catch (err: any) {
    console.log("RECONCILE BATCHES ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
