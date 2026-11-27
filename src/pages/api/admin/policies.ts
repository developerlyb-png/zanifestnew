import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";
import Agent from "@/models/Agent";
import { friendlyMessage, errorStatus } from "@/utils/friendlyError";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const admin = await requireAdmin(req);
      if (!admin) {
        return res.status(401).json({ success: false, message: "Not authorized" });
      }

      const { from, to, dateField } = req.query;
      const field = dateField === "createdAt" ? "createdAt" : "startDate";

      const query: any = {};
      if (from || to) {
        query[field] = {};
        if (from) query[field].$gte = new Date(String(from));
        if (to) query[field].$lte = new Date(String(to));
      }

      await dbConnect();

      // The dashboard list only needs to know *whether* a PDF/transaction-proof
      // exists (to show a view/upload icon) — not the base64 bytes themselves,
      // which is what was making this endpoint slow: every policy embeds its
      // uploaded PDF(s) directly in the document (same convention as PAN/
      // Aadhaar uploads elsewhere), so a full year's worth of policies meant
      // megabytes of base64 serialized on every load. Excluding those fields
      // here (full documents are still fetched on demand via
      // /api/admin/policies/[id] for viewing/the detail popup) plus .lean()
      // (skip Mongoose document hydration, not needed for a read-only list)
      // are the two levers that actually matter at this collection size.
      const policies = await IssuedPolicy.find(query, {
        "policyDocuments.data": 0,
        "paymentDetails.transactionProof.data": 0,
      })
        .sort({ createdAt: -1 })
        .lean();

      // Agent code for agent-linked policies (list column / search / export).
      const agentIds = Array.from(
        new Set(policies.map((p: any) => p.createdByAgentId && String(p.createdByAgentId)).filter(Boolean)),
      );
      if (agentIds.length) {
        const agents: any[] = await Agent.find({ _id: { $in: agentIds } }).select("agentCode phone email").lean();
        const byId = new Map(agents.map((a) => [String(a._id), a]));
        for (const p of policies as any[]) {
          const a = p.createdByAgentId && byId.get(String(p.createdByAgentId));
          if (a) {
            p.agentCode = p.soldByAgent?.code || a.agentCode || "";
            p.agentMobile = p.soldByAgent?.mobile || a.phone || "";
            p.agentEmail = p.soldByAgent?.email || a.email || "";
          }
        }
      }

      return res.status(200).json({ success: true, policies });
    } catch (err: any) {
      console.log("ADMIN POLICIES ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  if (req.method === "POST") {
    try {
      const admin = await requireAdmin(req);
      if (!admin) {
        return res.status(401).json({ success: false, message: "Not authorized" });
      }

      const body = req.body || {};

      const requiredFields = ["policyNumber", "insurer", "lineOfBusiness", "premium"];
      const missing = requiredFields.filter((f) => !body[f] && body[f] !== 0);
      if (missing.length) {
        return res.status(400).json({
          success: false,
          message: `Missing required field(s): ${missing.join(", ")}`,
        });
      }

      await dbConnect();

      const existing = await IssuedPolicy.findOne({ policyNumber: body.policyNumber });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Policy Number "${body.policyNumber}" already exists`,
        });
      }

      const adminName =
        `${(admin as any).userFirstName ?? ""} ${(admin as any).userLastName ?? ""}`.trim() ||
        (admin as any).email;

      const policy = await IssuedPolicy.create({
        ...body,
        source: "manual",
        createdBy: adminName,
      });

      return res.status(201).json({ success: true, policy });
    } catch (err: any) {
      console.log("ADMIN POLICIES CREATE ERROR", err);
      return res.status(errorStatus(err, 500)).json({ success: false, message: friendlyMessage(err) });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
