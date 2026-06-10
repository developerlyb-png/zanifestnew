import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import Sale from "@/models/sales/sale";
import Manager from "@/models/Manager";
import jwt, { JwtPayload } from "jsonwebtoken";
import ReassignmentHistory from "@/models/ReassignmentHistory";

interface CustomJwtPayload extends JwtPayload {
  id: string;
  role: string;
  email: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    await dbConnect();

    const token = req.cookies.agentToken; // ✅ COOKIE
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as CustomJwtPayload;
    if (decoded.role !== "agent") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const agent = await Agent.findById(decoded.id);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    const allSales = await Sale.find({ agent: agent._id })
      .select("amount saleDate")
      .lean();

    const reassignments = await ReassignmentHistory.find({ agent: agent._id });

    const dmSalesMap: Record<string, number> = {};

    for (const r of reassignments) {
      if (r.fromManager) {
        dmSalesMap[r.fromManager] =
          (dmSalesMap[r.fromManager] || 0) + (r.salesUnderPrevDM || 0);
      }
    }

    if (agent.assignedTo) {
      dmSalesMap[agent.assignedTo] =
        (dmSalesMap[agent.assignedTo] || 0) + agent.currentDMSales;
    }

    const managers = await Manager.find({
      managerId: { $in: Object.keys(dmSalesMap) },
    });

    const dmHistory = Object.keys(dmSalesMap).map((dmId) => {
      const dm = managers.find((m) => m.managerId === dmId);
      return {
        dmId,
        dmName: dm?.name || dmId,
        sales: dmSalesMap[dmId],
      };
    });

    return res.json({
      success: true,
      sales: {
        lifetime: agent.lifetimeSales,
        underCurrentDM: agent.currentDMSales,
        dmHistory,
        allSales,
      },
      assignedTo: agent.assignedTo,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
