import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminOrAgent } from "@/utils/requireAdminOrAgent";
import dbConnect from "@/lib/dbConnect";
import CustomInsurer from "@/models/CustomInsurer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const staff = await requireAdminOrAgent(req);
  if (!staff) {
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
