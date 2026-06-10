// pages/api/getagent.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import Manager from "@/models/Manager";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const token = req.cookies.managerToken;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: string;
      email: string;
      name: string;
    };

    if (decoded.role !== "district") {
      return res.status(403).json({ message: "Only district managers can view agents" });
    }

    // ✅ Fetch manager to get managerId
    const manager = await Manager.findById(decoded.id);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    // ✅ Correct query → using manager.managerId (string)
    const agents = await Agent.find({ assignedTo: manager.managerId });

    return res.status(200).json({ agents });
  } catch (error: any) {
    console.error("Error fetching agents:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
}
