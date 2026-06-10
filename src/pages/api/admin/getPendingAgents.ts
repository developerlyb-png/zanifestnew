// pages/api/admin/getPendingAgents.ts
import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Agent from "@/models/Agent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    const agents = await Agent.find({ status: "pending" }).select("firstName lastName email agentCode createdAt");
    return res.status(200).json(agents);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch agents" });
  }
}
