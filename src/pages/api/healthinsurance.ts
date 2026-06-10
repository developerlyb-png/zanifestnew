import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import HealthInsurance from "@/models/HealthInsurance";
import User from "@/models/User";
import Agent from "@/models/Agent";
import { verifyToken } from "@/utils/verifyToken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  let email = null;

  try {
    const token = req.cookies?.userToken || null;

    if (token) {
      const decoded: any = await verifyToken(token);
      if (decoded?.id) {
        const user = await User.findById(decoded.id).select("email");
        if (user) email = user.email;
      }
    }
  } catch (err) {
    console.log("Email fetch failed:", err);
  }

  if (req.method === "POST" && req.query.assign === "true") {
    try {
      const { policyId, agentId } = req.body;

      if (!policyId || !agentId) {
        return res.status(400).json({ success: false, message: "Missing policyId or agentId" });
      }

      const agent = await Agent.findById(agentId);
      if (!agent) {
        return res.status(404).json({ success: false, message: "Agent not found" });
      }

      const updated = await HealthInsurance.findByIdAndUpdate(
        policyId,
        {
          assignedAgent: agentId,
          assignedTo: `${agent.firstName} ${agent.lastName} (${agent.email})`,
          assignedAt: new Date(),
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: "Policy not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Lead assigned successfully",
        data: updated,
      });
    } catch (err: any) {
      console.error("ASSIGN ERROR:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const record = await HealthInsurance.create({
        ...req.body,
        email,
        assignedAgent: null,
        assignedTo: null,
        assignedAt: null,
      });

      return res.status(201).json({ success: true, data: record });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  if (req.method === "GET") {
    const records = await HealthInsurance.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: records });
  }

  return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
