import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";

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

      const policies = await IssuedPolicy.find(query).sort({ createdAt: -1 });

      return res.status(200).json({ success: true, policies });
    } catch (err: any) {
      console.log("ADMIN POLICIES ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
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
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
