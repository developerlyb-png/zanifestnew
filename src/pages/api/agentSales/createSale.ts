import dbConnect from "@/lib/dbConnect";
import Sale from "@/models/sales/sale";
import Agent from "@/models/Agent";
import { NextApiResponse, NextApiRequest } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  await dbConnect();

  try {
    const { agentId, amount } = req.body;

    if (!agentId || !amount) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // ✅ Find the agent
    const agent = await Agent.findById(agentId);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    // ✅ Get assigned District Manager
    const districtManager = agent.assignedTo;
    if (!districtManager)
      return res.status(400).json({ message: "Agent is not assigned to any District Manager" });

    // ✅ Create the sale
    const sale = await Sale.create({
      amount,
      agent: agent._id,
      districtManager,
      saleStatus: "active",
    });

    res.status(201).json({ success: true, sale });
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
