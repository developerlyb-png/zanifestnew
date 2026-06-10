import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await dbConnect();

  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { agentId, ...data } = req.body;

    if (!agentId) {
      return res.status(400).json({ message: "Agent ID required" });
    }

    const updatedAgent = await Agent.findByIdAndUpdate(
      agentId,
      data,
      { new: true }
    );

    if (!updatedAgent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    return res.status(200).json({
      success: true,
      agent: updatedAgent,
    });
  } catch (error) {
    console.error("Update Agent Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}