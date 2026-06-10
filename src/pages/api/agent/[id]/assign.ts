import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import ReassignmentHistory from "@/models/ReassignmentHistory";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const { assignedTo } = req.body;

      if (!assignedTo) {
        return res.status(400).json({ success: false, message: "Manager ID is required" });
      }

      const agent = await Agent.findById(id);
      if (!agent) {
        return res.status(404).json({ success: false, message: "Agent not found" });
      }

      const oldManagerId = agent.assignedTo?.toString() || null;
      if (oldManagerId === assignedTo) {
        return res.status(200).json({
          success: true,
          message: "No reassignment needed — manager unchanged",
          agent,
        });
      }

      // ✅ capture sales done under the previous DM
      const salesUnderPrevDM = agent.currentDMSales || 0;

      // ✅ store reassignment record
      const managerShift = await ReassignmentHistory.create({
        agent: agent._id,
        fromManager: oldManagerId,
        toManager: assignedTo,
        salesUnderPrevDM,
        reassignedAt: new Date(),
      });

      // ✅ reset DM-related sales
      agent.assignedTo = assignedTo;
      agent.currentDMSales = 0;
      await agent.save();

      res.status(200).json({
        success: true,
        message: "Manager reassigned successfully",
        oldManagerId,
        newManagerId: assignedTo,
        managerShift,
      });

    } catch (error) {
      console.error("Error updating assignedTo:", error);
      res.status(500).json({ success: false, message: "Failed to update agent assignment" });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
