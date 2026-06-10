import dbConnect from "@/lib/dbConnect";
import Sale from "@/models/sales/sale";
import Agent from "@/models/Agent";
import Manager from "@/models/Manager";
import { NextApiResponse, NextApiRequest } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  await dbConnect();

  try {
    const { agentId, amount } = req.body;

    if (!agentId || !amount) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // ✅ 1️⃣ Find Agent
    const agent = await Agent.findById(agentId).populate("assignedTo");
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    const districtManager = agent.assignedTo;
    if (!districtManager)
      return res
        .status(400)
        .json({ message: "Agent is not assigned to any District Manager" });

    // ✅ 2️⃣ Create Sale
    const sale = await Sale.create({
      amount,
      agent: agent._id,
      districtManager: districtManager._id,
      saleDate: new Date(),
      saleStatus: "active",
    });

    // ✅ 3️⃣ Update Agent’s lifetime sales
    agent.lifetimeSales = (agent.lifetimeSales || 0) + amount;
    await agent.save();

    // ✅ 4️⃣ Update District Manager’s total sales
    districtManager.totalSales = (districtManager.totalSales || 0) + amount;
    await districtManager.save();

    // ✅ 5️⃣ Cascade up to SM and NM
    let stateManager, nationalManager;

    if (districtManager.assignedTo) {
      stateManager = await Manager.findById(districtManager.assignedTo);
      if (stateManager) {
        stateManager.totalSales = (stateManager.totalSales || 0) + amount;
        await stateManager.save();

        if (stateManager.assignedTo) {
          nationalManager = await Manager.findById(stateManager.assignedTo);
          if (nationalManager) {
            nationalManager.totalSales =
              (nationalManager.totalSales || 0) + amount;
            await nationalManager.save();
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Sale created and totals updated successfully",
      sale,
    });
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
