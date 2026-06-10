// /pages/api/policy/save.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Policy from "@/models/Policy";

type Field = { label?: string; value: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { fields, status, date } = req.body as {
      fields: Field[];
      status: string;
      date: string;
    };

    const created = await Policy.create({ fields, status, date });
    return res.status(201).json({ success: true, policy: created });
  } catch (err) {
    console.error("Save policy error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
