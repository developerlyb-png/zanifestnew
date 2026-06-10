import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Shop from "@/models/Shop";
import User from "@/models/User";
import Agent from "@/models/Agent";
import { verifyToken } from "@/utils/verifyToken";

const MONGODB_URI = process.env.MONGODB_URI || "";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  let email = null;
  const token = req.cookies?.userToken;

  if (token) {
    const decoded: any = await verifyToken(token);
    if (decoded?.id) {
      const user = await User.findById(decoded.id).select("email");
      if (user) email = user.email;
    }
  }

  try {
    // ⭐ ASSIGN TO AGENT
    if (req.method === "POST" && req.query.assign === "true") {
      const { shopId, agentId } = req.body;

      if (!shopId || !agentId)
        return res.status(400).json({ success: false, message: "Missing fields" });

      const agent = await Agent.findById(agentId).select("email");
      if (!agent)
        return res.status(404).json({ success: false, message: "Agent not found" });

      const updated = await Shop.findByIdAndUpdate(
        shopId,
        {
          assignedAgent: agentId,
          assignedTo: agent.email,
          assignedAt: new Date(),
        },
        { new: true }
      );

      return res.status(200).json({ success: true, data: updated });
    }

    // ⭐ CREATE SHOP INSURANCE
    if (req.method === "POST") {
      const newRecord = await Shop.create({
        ...req.body,
        email,
        assignedAgent: null,
        assignedTo: null,
        assignedAt: null,
      });

      return res.status(201).json({ success: true, data: newRecord });
    }

    // ⭐ GET SHOP INSURANCE LIST
    if (req.method === "GET") {
      const shops = await Shop.find().sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: shops });
    }

    return res.status(405).json({ success: false, message: "Method Not Allowed" });

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
