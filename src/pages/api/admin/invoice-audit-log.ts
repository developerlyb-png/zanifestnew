import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import InvoiceAuditLog from "@/models/InvoiceAuditLog";

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

// Read-only by design — this tab reports on the Invoice/InvoiceClient/
// InvoiceItem writes other endpoints already make via src/lib/invoiceAudit.ts;
// it never writes anything itself.
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
    const { entityType, from, to, q } = req.query;

    const query: any = {};
    if (entityType && entityType !== "all") {
      query.entityType = String(entityType);
    }
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(String(from));
      if (to) query.createdAt.$lte = new Date(String(to));
    }
    if (q) {
      const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ entityLabel: rx }, { summary: rx }, { performedBy: rx }];
    }

    const logs = await InvoiceAuditLog.find(query).sort({ createdAt: -1 }).limit(500).lean();
    return res.status(200).json({ success: true, logs });
  } catch (err: any) {
    console.log("INVOICE AUDIT LOG GET ERROR", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
