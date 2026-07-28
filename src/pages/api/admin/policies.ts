import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import IssuedPolicy from "@/models/IssuedPolicy";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Only GET" });
  }

  try {
    const token = req.cookies["adminToken"];
    const data = token ? await verifyToken(token) : null;

    if (
      !data ||
      typeof data !== "object" ||
      !("role" in data) ||
      !["superadmin", "admin"].includes((data as any).role)
    ) {
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
