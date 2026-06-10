import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  await dbConnect();

  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {

    const cookies = parse(req.headers.cookie || "");
    const token = cookies.adminToken;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ message: "Agent ID required" });
    }

    // editable fields
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "city",
      "district",
      "state",
      "panNumber",
      "adhaarNumber",
      "yearofpassing10th",
      "yearofpassing12th"
    ];

    const updates: any = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedAgent = await Agent.findByIdAndUpdate(
      agentId,
      updates,
      { new: true }
    ).lean();

    if (!updatedAgent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    return res.status(200).json({
      message: "Agent updated successfully",
      agent: updatedAgent
    });

  } catch (error) {

    console.error("PATCH /api/admin/updateAgent Error:", error);

    return res.status(500).json({ message: "Server error" });

  }
}