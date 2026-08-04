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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Policy id is required" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const policy = await IssuedPolicy.findById(id);
      if (!policy) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }
      return res.status(200).json({ success: true, policy });
    } catch (err: any) {
      console.log("ADMIN POLICY GET ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const policy = await IssuedPolicy.findByIdAndDelete(id);
      if (!policy) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.log("ADMIN POLICY DELETE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
