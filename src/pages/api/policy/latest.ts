import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/lib/dbConnect";
import Policy from "@/models/Policy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false });
  }

  try {
    await connectDB();

    const policy = await Policy.findOne({ verified: true })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, policy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}
