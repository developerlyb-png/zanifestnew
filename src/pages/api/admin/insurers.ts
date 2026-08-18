import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/utils/verifyToken";
import dbConnect from "@/lib/dbConnect";
import CustomInsurer from "@/models/CustomInsurer";

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

  await dbConnect();

  if (req.method === "GET") {
    try {
      const insurers = await CustomInsurer.find().sort({ name: 1 });
      return res.status(200).json({ success: true, insurers: insurers.map((i: any) => i.name) });
    } catch (err: any) {
      console.log("ADMIN INSURERS ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const name = String(req.body?.name || "").trim();
      if (!name) {
        return res.status(400).json({ success: false, message: "Insurance company name is required" });
      }
      const insurer = await CustomInsurer.findOneAndUpdate(
        { name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
        { $setOnInsert: { name } },
        { new: true, upsert: true }
      );
      return res.status(201).json({ success: true, insurer: insurer.name });
    } catch (err: any) {
      console.log("ADMIN INSURERS CREATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
