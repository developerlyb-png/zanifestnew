import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import TravelInsurance from "@/models/TravelInsurance";
import Agent from "@/models/Agent";
import User from "@/models/User";
import { verifyToken } from "@/utils/verifyToken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const userToken = req.cookies?.userToken || null;
  let emailFromToken = null;

  if (userToken) {
    try {
      const decoded: any = await verifyToken(userToken);
      if (decoded?.id) {
        const user = await User.findById(decoded.id).select("email");
        if (user) emailFromToken = user.email;
      }
    } catch (err) {
      console.log("Token decode failed");
    }
  }

  // -------------------- ASSIGN LEAD TO AGENT --------------------
  if (req.method === "POST" && req.query.assign === "true") {
    try {
      const { policyId, agentId } = req.body;

      if (!policyId || !agentId) {
        return res.status(400).json({ success: false, message: "Missing fields" });
      }

      const agent = await Agent.findById(agentId).select("firstName lastName email");
      if (!agent) {
        return res.status(404).json({ success: false, message: "Agent not found" });
      }

      const updated = await TravelInsurance.findByIdAndUpdate(
        policyId,
        {
          assignedAgent: agentId,
          assignedTo: agent.email,     
          assignedAt: new Date(),
        },
        { new: true }
      );

      if (!updated)
        return res.status(404).json({ success: false, message: "Policy not found" });

      return res.status(200).json({
        success: true,
        message: "Lead assigned successfully",
        data: updated,
      });

    } catch (error: any) {
      console.error("ASSIGN ERROR:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // -------------------- CREATE TRAVEL INSURANCE --------------------
  if (req.method === "POST") {
    try {
      const newRecord = new TravelInsurance({
        ...req.body,
        email: emailFromToken ? emailFromToken : req.body.email,
        assignedAgent: null,
        assignedTo: null,
        assignedAt: null,
      });

      const saved = await newRecord.save();
      return res.status(201).json({ success: true, data: saved });

    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  // -------------------- GET ALL TRAVEL INSURANCE --------------------
  if (req.method === "GET") {
    const data = await TravelInsurance.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data });
  }

  return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
