// pages/api/agents/reassign.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import jwt from "jsonwebtoken";

interface DecodedToken {
  id: string;
  role: string;
  email: string;
  userFirstName?: string;
  userLastName?: string;
  accountStatus?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  await dbConnect();

  try {
    // ✅ Step 1: Extract token from cookies
    const token = req.cookies.adminToken;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No admin token found" });
    }

    // ✅ Step 2: Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;

    // ✅ Step 3: Allow only admin or superadmin
    if (decoded.role !== "admin" && decoded.role !== "superadmin") {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    // ✅ Step 4: Extract agent and new manager info from body
    const { agentId, newDistrictManagerId } = req.body;

    if (!agentId || !newDistrictManagerId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Step 5: Find and update the agent
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    agent.assignedTo = newDistrictManagerId;
    await agent.save();

    return res.status(200).json({
      success: true,
      message: "Agent reassigned successfully",
      updatedAgent: agent,
    });
  } catch (error: any) {
    console.error("Error reassigning agent:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
