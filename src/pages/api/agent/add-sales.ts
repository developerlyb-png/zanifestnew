import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import Manager from "@/models/Manager";
import Sale from "@/models/sales/sale";
import jwt, { JwtPayload } from "jsonwebtoken";

interface CustomJwtPayload extends JwtPayload {
  id: string;
  role: string;
  email: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
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

    const { amount } = req.body;
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const agent = await Agent.findById(decoded.id);
    if (!agent || !agent.assignedTo) {
      return res.status(400).json({ success: false, message: "Agent not assigned" });
    }

    const manager = await Manager.findOne({ managerId: agent.assignedTo });
    if (!manager) {
      return res.status(404).json({ success: false, message: "Manager not found" });
    }

    agent.lifetimeSales += amount;
    agent.currentDMSales += amount;
    manager.totalSales += amount;

    await Sale.create({
      amount,
      agent: agent._id,
      districtManager: agent.assignedTo,
      saleDate: new Date(),
      saleStatus: "active",
    });

    await Promise.all([agent.save(), manager.save()]);

    return res.json({
      success: true,
      newSales: {
        lifetime: agent.lifetimeSales,
        underCurrentDM: agent.currentDMSales,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}