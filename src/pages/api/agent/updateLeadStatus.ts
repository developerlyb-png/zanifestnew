import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Lead from "@/models/lead";
import { verifyToken } from "@/utils/verifyToken";

const MONGODB_URI = process.env.MONGODB_URI!;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ success: false });
  }

  await connectDB();

  const token = req.cookies.agentToken;
  if (!token) return res.status(401).json({ success: false });

  try {
    await verifyToken(token);

    const { leadId, status, remark } = req.body;

    await Lead.findByIdAndUpdate(leadId, { status, remark });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
