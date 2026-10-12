import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminOrAgent } from "@/utils/requireAdminOrAgent";
import dbConnect from "@/lib/dbConnect";
import CustomRto from "@/models/CustomRto";

// Extra RTO codes added from the Pay In Pay Out rule form when a code isn't
// in the static RTO master list — mirrors /api/admin/motormakes.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const staff = await requireAdminOrAgent(req);
  if (!staff) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  await dbConnect();

  if (req.method === "GET") {
    try {
      const codes = await CustomRto.find().sort({ code: 1 });
      return res.status(200).json({ success: true, codes: codes.map((c: any) => c.code) });
    } catch (err: any) {
      console.log("ADMIN RTO CODES ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const code = String(req.body?.code || "").trim().toUpperCase();
      if (!code) {
        return res.status(400).json({ success: false, message: "RTO code is required" });
      }
      if (!/^[A-Z0-9-]{2,10}$/.test(code)) {
        return res.status(400).json({ success: false, message: "RTO code looks invalid, e.g. UP-14" });
      }
      const rto = await CustomRto.findOneAndUpdate(
        { code },
        { $setOnInsert: { code } },
        { new: true, upsert: true }
      );
      return res.status(201).json({ success: true, code: rto.code });
    } catch (err: any) {
      console.log("ADMIN RTO CODES CREATE ERROR", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
