import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Marine from "@/models/Marinemodule";

const MONGODB_URI = process.env.MONGODB_URI || "";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  try {
    switch (req.method) {
      case "POST": {
        const record = await Marine.create(req.body);
        return res.status(201).json({ success: true, data: record });
      }

      case "GET": {
        const all = await Marine.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: all });
      }

     case "PUT": {
  const { marineId, agentId, agentName } = req.body;

  if (!marineId || !agentId) {
    return res.status(400).json({
      success: false,
      message: "Missing marineId or agentId",
    });
  }

  const updated = await Marine.findByIdAndUpdate(
    marineId,
    {
      assignedAgent: agentId,
      assignedAgentName: agentName,
      assignedAt: new Date()
    },
    { new: true }
  );

  return res.status(200).json({
    success: true,
    message: "Agent assigned successfully",
    data: updated
  });
}


      default:
        return res.status(405).json({ success: false, message: "Not allowed" });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
